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

export async function loginAction(formData: { identifier: string; password: string }) {
  // Ensure default admin exists on first login attempt
  await ensureDefaultAdmin();

  const identifier = formData.identifier?.trim();
  const password = formData.password;

  if (!identifier || !password) {
    throw new Error('Please enter both your username/email and password.');
  }

  const user = await verifyUserCredentials(identifier, password);
  if (!user) {
    throw new Error('Invalid username/email or password.');
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
}

export async function logoutAction() {
  await clearSession();
  return { success: true };
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}) {
  const currentUser = await requireUser();

  if (!data.currentPassword || !data.newPassword) {
    throw new Error('Current password and new password are required.');
  }

  if (data.newPassword.length < 4) {
    throw new Error('New password must be at least 4 characters long.');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { passwordHash: true },
  });

  if (!dbUser) {
    throw new Error('User not found.');
  }

  const isValid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
  if (!isValid) {
    throw new Error('The current password you entered is incorrect.');
  }

  const newHash = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { passwordHash: newHash },
  });

  return { success: true, message: 'Password updated successfully.' };
}

export async function changeUsernameAction(data: { newUsername: string }) {
  const currentUser = await requireUser();
  const raw = data.newUsername?.trim().toLowerCase();

  if (!raw || raw.length < 3) {
    throw new Error('Username must be at least 3 characters long.');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(raw)) {
    throw new Error('Username can only contain letters, numbers, hyphens, and underscores.');
  }

  // Check if username is already taken by someone else
  const existing = await prisma.user.findFirst({
    where: {
      username: { equals: raw, mode: 'insensitive' },
      NOT: { id: currentUser.id },
    },
  });

  if (existing) {
    throw new Error(`Username "@${raw}" is already taken.`);
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { username: raw },
  });

  // Re-issue session with new username
  await createSession(currentUser.id, currentUser.email, currentUser.role, raw);
  revalidatePath('/settings');

  return { success: true, username: raw };
}
