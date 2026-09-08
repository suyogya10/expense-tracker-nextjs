'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  createSession,
  clearSession,
  requireUser,
  verifyUserCredentials,
  ensureDefaultAdmin,
} from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type LoginResult =
  | {
      success: true;
      user: {
        id: string;
        name: string;
        username: string | null;
        email: string;
        role: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function loginAction(formData: {
  identifier: string;
  password: string;
}): Promise<LoginResult> {
  try {
    // Ensure default admin exists on first login attempt
    await ensureDefaultAdmin();

    const identifier = formData.identifier?.trim();
    const password = formData.password;

    if (!identifier || !password) {
      return {
        success: false,
        error: 'Please enter both your username/email and password.',
      };
    }

    const user = await verifyUserCredentials(identifier, password);
    if (!user) {
      return {
        success: false,
        error: 'Invalid username/email or password.',
      };
    }

    await createSession(user.id, user.email, user.role, user.username);
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (err: any) {
    console.error('Login action error:', err);
    return {
      success: false,
      error: 'Unable to sign in at this moment. Please check your connection and try again.',
    };
  }
}

export async function logoutAction() {
  await clearSession();
  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const currentUser = await requireUser();

    if (!data.currentPassword || !data.newPassword) {
      return {
        success: false,
        error: 'Current password and new password are required.',
      };
    }

    if (data.newPassword.length < 4) {
      return {
        success: false,
        error: 'New password must be at least 4 characters long.',
      };
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { passwordHash: true },
    });

    if (!dbUser) {
      return {
        success: false,
        error: 'User not found.',
      };
    }

    const isValid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return {
        success: false,
        error: 'The current password you entered is incorrect.',
      };
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: newHash },
    });

    return { success: true, message: 'Password updated successfully.' };
  } catch (err: any) {
    console.error('changePasswordAction error:', err);
    return {
      success: false,
      error: err.message || 'Failed to update password.',
    };
  }
}

export async function changeUsernameAction(data: { newUsername: string }) {
  try {
    const currentUser = await requireUser();
    const raw = data.newUsername?.trim().toLowerCase();

    if (!raw || raw.length < 3) {
      return {
        success: false,
        error: 'Username must be at least 3 characters long.',
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
      return {
        success: false,
        error: 'Username can only contain letters, numbers, hyphens, and underscores.',
      };
    }

    // Check if username is already taken by someone else
    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: raw, mode: 'insensitive' },
        NOT: { id: currentUser.id },
      },
    });

    if (existing) {
      return {
        success: false,
        error: `Username "@${raw}" is already taken.`,
      };
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { username: raw },
    });

    // Re-issue session with new username
    await createSession(currentUser.id, currentUser.email, currentUser.role, raw);
    revalidatePath('/settings');

    return { success: true, username: raw };
  } catch (err: any) {
    console.error('changeUsernameAction error:', err);
    return {
      success: false,
      error: err.message || 'Failed to update username.',
    };
  }
}
