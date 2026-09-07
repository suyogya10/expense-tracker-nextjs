'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { calculateRecurringDateInCycle } from '@/lib/recurring';

const recurringSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  paymentMethodId: z.string().optional().nullable(),
  frequency: z.string().default('MONTHLY'),
  dayOfMonth: z.coerce.number().min(1).max(31).optional().nullable(),
  isInvestment: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createRecurringExpense(formData: z.infer<typeof recurringSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = recurringSchema.parse(formData);
  const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
  const isInvestment = validated.isInvestment || (category?.isInvestment ?? false);

  const rule = await prisma.recurringExpense.create({
    data: {
      userId: user.id,
      name: validated.name,
      amount: validated.amount,
      categoryId: validated.categoryId,
      paymentMethodId: validated.paymentMethodId || null,
      frequency: validated.frequency,
      dayOfMonth: validated.dayOfMonth || null,
      isInvestment,
      isEnabled: validated.isEnabled,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      notes: validated.notes || null,
    },
  });

  // If there is an active salary cycle, create an instance for it
  const activeCycle = await prisma.salaryMonth.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
  });

  if (activeCycle && rule.isEnabled) {
    const expectedDate = calculateRecurringDateInCycle(
      rule.dayOfMonth,
      activeCycle.startDate,
      activeCycle.endDate
    );

    await prisma.recurringExpenseInstance.upsert({
      where: {
        recurringExpenseId_salaryMonthId: {
          recurringExpenseId: rule.id,
          salaryMonthId: activeCycle.id,
        },
      },
      update: {},
      create: {
        recurringExpenseId: rule.id,
        salaryMonthId: activeCycle.id,
        expectedDate,
        amount: rule.amount,
        status: 'PENDING',
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/recurring');
  return rule;
}

export async function toggleRecurringExpense(id: string, isEnabled: boolean) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const updated = await prisma.recurringExpense.update({
    where: { id, userId: user.id },
    data: { isEnabled },
  });

  revalidatePath('/');
  revalidatePath('/recurring');
  return updated;
}

export async function updateRecurringExpense(id: string, formData: z.infer<typeof recurringSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = recurringSchema.parse(formData);
  const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
  const isInvestment = validated.isInvestment || (category?.isInvestment ?? false);

  const rule = await prisma.recurringExpense.update({
    where: { id, userId: user.id },
    data: {
      name: validated.name,
      amount: validated.amount,
      categoryId: validated.categoryId,
      paymentMethodId: validated.paymentMethodId || null,
      frequency: validated.frequency,
      dayOfMonth: validated.dayOfMonth || null,
      isInvestment,
      isEnabled: validated.isEnabled,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      notes: validated.notes || null,
    },
  });

  // If there is an active salary cycle, update any pending instance for this rule
  const activeCycle = await prisma.salaryMonth.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
  });

  if (activeCycle) {
    const expectedDate = calculateRecurringDateInCycle(
      rule.dayOfMonth,
      activeCycle.startDate,
      activeCycle.endDate
    );

    // Update pending instance if exists
    await prisma.recurringExpenseInstance.updateMany({
      where: {
        recurringExpenseId: rule.id,
        salaryMonthId: activeCycle.id,
        status: 'PENDING',
      },
      data: {
        amount: rule.amount,
        expectedDate,
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/recurring');
  revalidatePath('/expenses');
  revalidatePath('/analytics');
  return rule;
}

export async function deleteRecurringExpense(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.recurringExpense.delete({
    where: { id, userId: user.id },
  });

  revalidatePath('/');
  revalidatePath('/recurring');
  revalidatePath('/expenses');
  revalidatePath('/analytics');
  return { success: true };
}

export async function deleteRecurringInstance(instanceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const instance = await prisma.recurringExpenseInstance.findUnique({
    where: { id: instanceId },
    include: { salaryMonth: true },
  });

  if (!instance || instance.salaryMonth.userId !== user.id) {
    throw new Error('Recurring instance not found');
  }

  await prisma.recurringExpenseInstance.delete({
    where: { id: instanceId },
  });

  revalidatePath('/');
  revalidatePath('/recurring');
  revalidatePath('/expenses');
  revalidatePath('/analytics');
  return { success: true };
}

export async function confirmRecurringInstance(instanceId: string, paymentMethodId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const instance = await prisma.recurringExpenseInstance.findUnique({
    where: { id: instanceId },
    include: {
      recurringExpense: true,
      salaryMonth: true,
      expense: true,
    },
  });

  if (!instance || instance.salaryMonth.userId !== user.id) {
    throw new Error('Recurring instance not found');
  }

  // Idempotency: If an expense already exists for this instance, return it without creating duplicate
  if (instance.expense) {
    await prisma.recurringExpenseInstance.update({
      where: { id: instanceId },
      data: { status: 'CONFIRMED' },
    });
    return instance.expense;
  }

  // Create actual expense record
  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      salaryMonthId: instance.salaryMonthId,
      categoryId: instance.recurringExpense.categoryId,
      paymentMethodId:
        paymentMethodId ||
        instance.recurringExpense.paymentMethodId ||
        null,
      recurringInstanceId: instance.id,
      amount: instance.amount,
      date: instance.expectedDate,
      description: instance.recurringExpense.name,
      notes: instance.recurringExpense.notes,
      isInvestment: instance.recurringExpense.isInvestment,
    },
  });

  // Mark instance CONFIRMED
  await prisma.recurringExpenseInstance.update({
    where: { id: instanceId },
    data: { status: 'CONFIRMED' },
  });

  revalidatePath('/');
  revalidatePath('/expenses');
  revalidatePath('/recurring');
  revalidatePath('/analytics');

  return expense;
}

export async function skipRecurringInstance(instanceId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const instance = await prisma.recurringExpenseInstance.findUnique({
    where: { id: instanceId },
    include: { salaryMonth: true },
  });

  if (!instance || instance.salaryMonth.userId !== user.id) {
    throw new Error('Recurring instance not found');
  }

  await prisma.recurringExpenseInstance.update({
    where: { id: instanceId },
    data: { status: 'SKIPPED' },
  });

  revalidatePath('/');
  revalidatePath('/recurring');
  return { success: true };
}

export async function getRecurringExpenses() {
  const user = await getCurrentUser();
  if (!user) return [];

  const recurring = await prisma.recurringExpense.findMany({
    where: { userId: user.id },
    orderBy: { dayOfMonth: 'asc' },
    include: {
      category: true,
      paymentMethod: true,
      instances: {
        orderBy: { expectedDate: 'desc' },
        take: 3,
      },
    },
  });

  return recurring.map((r) => ({
    ...r,
    amount: Number(r.amount),
    startDate: r.startDate.toISOString(),
    endDate: r.endDate ? r.endDate.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    instances: r.instances.map((i) => ({
      ...i,
      amount: Number(i.amount),
      expectedDate: i.expectedDate.toISOString(),
    })),
  }));
}
