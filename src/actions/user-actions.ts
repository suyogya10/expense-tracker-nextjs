'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#f97316', isInvestment: false },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#10b981', isInvestment: false },
  { name: 'Transportation', icon: 'Car', color: '#06b6d4', isInvestment: false },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#eab308', isInvestment: false },
  { name: 'Housing & Rent', icon: 'Home', color: '#8b5cf6', isInvestment: false },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#f43f5e', isInvestment: false },
  { name: 'Entertainment', icon: 'Film', color: '#a855f7', isInvestment: false },
  { name: 'Health & Medical', icon: 'HeartPulse', color: '#ef4444', isInvestment: false },
  { name: 'SIP & Investment', icon: 'TrendingUp', color: '#22c55e', isInvestment: true },
  { name: 'Personal Care', icon: 'User', color: '#64748b', isInvestment: false },
  { name: 'Subscriptions', icon: 'Tv', color: '#d946ef', isInvestment: false },
  { name: 'Other', icon: 'HelpCircle', color: '#94a3b8', isInvestment: false },
];

const DEFAULT_PAYMENT_METHODS = [
  { name: 'Cash', icon: 'Wallet' },
  { name: 'Bank Account', icon: 'Landmark' },
  { name: 'Debit Card', icon: 'CreditCard' },
  { name: 'Digital Wallet', icon: 'Smartphone' },
];

export async function initializeUserDefaultCategoriesAndPaymentMethods(userId: string) {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await prisma.category.create({
        data: {
          userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          isInvestment: cat.isInvestment,
          isDefault: true,
        },
      });
    }

    for (const pm of DEFAULT_PAYMENT_METHODS) {
      await prisma.paymentMethod.create({
        data: {
          userId,
          name: pm.name,
          icon: pm.icon,
          isDefault: true,
        },
      });
    }
  } catch (err) {
    console.error(`Failed to initialize default items for user ${userId}:`, err);
  }
}

export async function getUsersAction() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      defaultSalary: true,
      currency: true,
      timezone: true,
      createdAt: true,
      _count: {
        select: {
          expenses: true,
          salaryMonths: true,
          recurringExpenses: true,
        },
      },
    },
    orderBy: [
      { role: 'asc' }, // 'ADMIN' before 'USER'
      { createdAt: 'asc' },
    ],
  });

  return users.map((u) => ({
    ...u,
    defaultSalary: Number(u.defaultSalary),
  }));
}

export async function createUserAction(formData: {
  name: string;
  username: string;
  email: string;
  password: string;
  role: string;
  defaultSalary?: number;
  currency?: string;
}) {
  await requireAdmin();

  const name = formData.name?.trim();
  const username = formData.username?.trim().toLowerCase();
  const email = formData.email?.trim().toLowerCase();
  const password = formData.password;
  const role = formData.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const defaultSalary = formData.defaultSalary ? Number(formData.defaultSalary) : 60000;
  const currency = formData.currency?.trim() || 'Rs.';

  if (!name || !username || !email || !password) {
    throw new Error('Name, username, email, and password are required.');
  }

  if (username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username)) {
    throw new Error('Username must be 3-20 characters long and contain only letters, numbers, hyphens, or underscores.');
  }

  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  // Check uniqueness of username
  const existingUsername = await prisma.user.findFirst({
    where: { username: { equals: username, mode: 'insensitive' } },
  });
  if (existingUsername) {
    throw new Error(`Username "@${username}" is already in use.`);
  }

  // Check uniqueness of email
  const existingEmail = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (existingEmail) {
    throw new Error(`Email "${email}" is already registered.`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const createdUser = await prisma.user.create({
    data: {
      name,
      username,
      email,
      passwordHash,
      role,
      defaultSalary,
      currency,
      timezone: 'Asia/Kathmandu',
    },
  });

  // Seed default categories & payment methods so the new user can start immediately
  await initializeUserDefaultCategoriesAndPaymentMethods(createdUser.id);

  revalidatePath('/users');
  return {
    id: createdUser.id,
    name: createdUser.name,
    username: createdUser.username,
    email: createdUser.email,
    role: createdUser.role,
  };
}

export async function updateUserAction(
  userId: string,
  formData: {
    name: string;
    username: string;
    email: string;
    role: string;
    defaultSalary?: number;
    currency?: string;
  }
) {
  await requireAdmin();

  const name = formData.name?.trim();
  const username = formData.username?.trim().toLowerCase();
  const email = formData.email?.trim().toLowerCase();
  const role = formData.role === 'ADMIN' ? 'ADMIN' : 'USER';
  const defaultSalary = formData.defaultSalary ? Number(formData.defaultSalary) : undefined;
  const currency = formData.currency?.trim();

  if (!name || !username || !email) {
    throw new Error('Name, username, and email are required.');
  }

  const existingTarget = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingTarget) {
    throw new Error('User not found.');
  }

  // Safeguard: If demoting an ADMIN to USER, ensure at least one other active ADMIN exists
  if (existingTarget.role === 'ADMIN' && role !== 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new Error('Cannot demote this user. There must be at least one active Administrator in the system.');
    }
  }

  // Check username uniqueness
  const conflictUsername = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: 'insensitive' },
      NOT: { id: userId },
    },
  });
  if (conflictUsername) {
    throw new Error(`Username "@${username}" is already in use.`);
  }

  // Check email uniqueness
  const conflictEmail = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: 'insensitive' },
      NOT: { id: userId },
    },
  });
  if (conflictEmail) {
    throw new Error(`Email "${email}" is already registered.`);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      username,
      email,
      role,
      ...(defaultSalary !== undefined ? { defaultSalary } : {}),
      ...(currency ? { currency } : {}),
    },
  });

  revalidatePath('/users');
  return {
    id: updated.id,
    name: updated.name,
    username: updated.username,
    email: updated.email,
    role: updated.role,
  };
}

export async function deleteUserAction(userId: string) {
  const currentAdmin = await requireAdmin();

  // Safeguard 1: Cannot delete self
  if (currentAdmin.id === userId) {
    throw new Error('You cannot delete your own account while logged in as Administrator.');
  }

  // Safeguard 2: Cannot delete the last remaining ADMIN
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, username: true },
  });

  if (!targetUser) {
    throw new Error('User not found.');
  }

  if (targetUser.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      throw new Error('Cannot delete this user. There must be at least one active Administrator in the system.');
    }
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath('/users');
  return { success: true, message: `User "${targetUser.name}" deleted successfully.` };
}

export async function adminResetPasswordAction(userId: string, newPassword: string) {
  await requireAdmin();

  if (!newPassword || newPassword.length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath('/users');
  return { success: true, message: 'Password reset successfully.' };
}
