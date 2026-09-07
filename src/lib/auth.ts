import { cookies } from 'next/headers';
import { cache } from 'react';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'super-secret-expense-tracker-jwt-key-minimum-32-chars-long'
);
export const SESSION_COOKIE = 'expense_session';

export interface SessionPayload {
  userId: string;
  email: string;
  username?: string | null;
  role: string;
}

export async function createSession(
  userId: string,
  email: string,
  role: string = 'USER',
  username?: string | null
) {
  const token = await new SignJWT({ userId, email, role, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });

  return token;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, SECRET);
    if (!payload?.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        currency: true,
        timezone: true,
        defaultSalary: true,
      },
    });

    if (user) {
      return {
        ...user,
        defaultSalary: Number(user.defaultSalary),
      };
    }

    return null;
  } catch (err) {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized: Please log in to continue');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Administrator privileges required');
  }
  return user;
}

export async function verifyUserCredentials(identifier: string, password: string) {
  const clean = identifier.trim();
  if (!clean || !password) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: clean, mode: 'insensitive' } },
        { email: { equals: clean, mode: 'insensitive' } },
      ],
    },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    role: user.role,
    currency: user.currency,
    timezone: user.timezone,
    defaultSalary: Number(user.defaultSalary),
  };
}

export async function ensureDefaultAdmin() {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { role: 'ADMIN' },
        ],
      },
    });

    if (!admin) {
      const passwordHash = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@expensetracker.local',
          name: 'Administrator',
          passwordHash,
          role: 'ADMIN',
          currency: 'Rs.',
          timezone: 'Asia/Kathmandu',
          defaultSalary: 60000,
        },
      });
    }
  } catch (err) {
    console.error('ensureDefaultAdmin error:', err);
  }
}
