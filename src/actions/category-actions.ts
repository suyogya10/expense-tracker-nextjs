'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1).default('Tag'),
  color: z.string().min(1).default('#64748b'),
  isInvestment: z.boolean().default(false),
});

export async function getCategories() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.category.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(formData: z.infer<typeof categorySchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = categorySchema.parse(formData);

  const category = await prisma.category.create({
    data: {
      userId: user.id,
      name: validated.name.trim(),
      icon: validated.icon,
      color: validated.color,
      isInvestment: validated.isInvestment,
    },
  });

  revalidatePath('/expenses');
  revalidatePath('/settings');
  return category;
}

export async function updateCategory(
  id: string,
  formData: Partial<z.infer<typeof categorySchema>>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const updated = await prisma.category.update({
    where: { id, userId: user.id },
    data: {
      name: formData.name?.trim(),
      icon: formData.icon,
      color: formData.color,
      isInvestment: formData.isInvestment,
    },
  });

  revalidatePath('/expenses');
  revalidatePath('/settings');
  return updated;
}

export async function deleteCategory(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  // Check if any expenses are linked
  const expenseCount = await prisma.expense.count({
    where: { categoryId: id },
  });

  if (expenseCount > 0) {
    throw new Error(`Cannot delete category with ${expenseCount} existing expenses. Reassign them first.`);
  }

  await prisma.category.delete({
    where: { id, userId: user.id },
  });

  revalidatePath('/expenses');
  revalidatePath('/settings');
  return { success: true };
}

// Payment Methods
const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Payment method name is required'),
  icon: z.string().min(1).default('CreditCard'),
});

export async function getPaymentMethods() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: { name: 'asc' },
  });
}

export async function createPaymentMethod(formData: z.infer<typeof paymentMethodSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = paymentMethodSchema.parse(formData);

  const pm = await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      name: validated.name.trim(),
      icon: validated.icon,
    },
  });

  revalidatePath('/expenses');
  revalidatePath('/settings');
  return pm;
}

export async function deletePaymentMethod(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.paymentMethod.delete({
    where: { id, userId: user.id },
  });

  revalidatePath('/expenses');
  revalidatePath('/settings');
  return { success: true };
}
