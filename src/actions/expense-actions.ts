'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isDateInCycle } from '@/lib/salary-cycle';

const expenseSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  paymentMethodId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isInvestment: z.boolean().default(false),
  salaryMonthId: z.string().optional(),
  recurringInstanceId: z.string().optional().nullable(),
});

export async function createExpense(formData: z.infer<typeof expenseSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = expenseSchema.parse(formData);
  const expenseDate = new Date(validated.date);

  // 1. Determine which SalaryMonth this expense belongs to based on date
  let salaryMonthId = validated.salaryMonthId;

  if (!salaryMonthId) {
    const matchingCycle = await prisma.salaryMonth.findFirst({
      where: {
        userId: user.id,
        startDate: { lte: expenseDate },
        endDate: { gte: expenseDate },
      },
      orderBy: { startDate: 'desc' },
    });

    if (matchingCycle) {
      salaryMonthId = matchingCycle.id;
    } else {
      // Fallback to currently active cycle
      const activeCycle = await prisma.salaryMonth.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        orderBy: { startDate: 'desc' },
      });
      if (activeCycle) {
        salaryMonthId = activeCycle.id;
      } else {
        throw new Error('No active salary cycle found for this date. Please create a salary cycle first.');
      }
    }
  }

  // 2. Check if category is an investment category
  const category = await prisma.category.findUnique({
    where: { id: validated.categoryId },
  });
  const isInvestment = validated.isInvestment || (category?.isInvestment ?? false);

  // 3. Create expense
  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      salaryMonthId,
      categoryId: validated.categoryId,
      paymentMethodId: validated.paymentMethodId || null,
      recurringInstanceId: validated.recurringInstanceId || null,
      amount: validated.amount,
      date: expenseDate,
      description: validated.description,
      notes: validated.notes || null,
      isInvestment,
    },
    include: {
      category: true,
      paymentMethod: true,
      salaryMonth: true,
    },
  });

  // If created from a recurring instance, mark instance CONFIRMED
  if (validated.recurringInstanceId) {
    await prisma.recurringExpenseInstance.update({
      where: { id: validated.recurringInstanceId },
      data: { status: 'CONFIRMED' },
    });
  }

  revalidatePath('/');
  revalidatePath('/expenses');
  revalidatePath('/analytics');
  revalidatePath('/budgets');

  return {
    ...expense,
    amount: Number(expense.amount),
    date: expense.date.toISOString(),
  };
}

export async function updateExpense(
  id: string,
  formData: Partial<z.infer<typeof expenseSchema>>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
    include: { salaryMonth: true },
  });
  if (!existing) throw new Error('Expense not found');

  let salaryMonthId = existing.salaryMonthId;
  let cycleChangedInfo: { fromName: string; toName: string } | null = null;

  if (formData.date) {
    const newDate = new Date(formData.date);
    const stillInSameCycle = isDateInCycle(
      newDate,
      existing.salaryMonth.startDate,
      existing.salaryMonth.endDate
    );

    if (!stillInSameCycle) {
      // Find new cycle
      const targetCycle = await prisma.salaryMonth.findFirst({
        where: {
          userId: user.id,
          startDate: { lte: newDate },
          endDate: { gte: newDate },
        },
      });

      if (targetCycle) {
        salaryMonthId = targetCycle.id;
        cycleChangedInfo = {
          fromName: existing.salaryMonth.name,
          toName: targetCycle.name,
        };
      }
    }
  }

  const category = formData.categoryId
    ? await prisma.category.findUnique({ where: { id: formData.categoryId } })
    : null;

  const isInvestment =
    formData.isInvestment !== undefined
      ? formData.isInvestment
      : category
      ? category.isInvestment
      : existing.isInvestment;

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      salaryMonthId,
      categoryId: formData.categoryId || existing.categoryId,
      paymentMethodId:
        formData.paymentMethodId !== undefined ? formData.paymentMethodId : existing.paymentMethodId,
      amount: formData.amount !== undefined ? formData.amount : existing.amount,
      date: formData.date ? new Date(formData.date) : existing.date,
      description: formData.description || existing.description,
      notes: formData.notes !== undefined ? formData.notes : existing.notes,
      isInvestment,
    },
    include: { category: true, paymentMethod: true, salaryMonth: true },
  });

  revalidatePath('/');
  revalidatePath('/expenses');
  revalidatePath('/analytics');

  return {
    expense: {
      ...updated,
      amount: Number(updated.amount),
      date: updated.date.toISOString(),
    },
    cycleChangedInfo,
  };
}

export async function deleteExpense(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error('Expense not found');

  // If this was linked to a recurring instance, revert status to PENDING
  if (existing.recurringInstanceId) {
    await prisma.recurringExpenseInstance.update({
      where: { id: existing.recurringInstanceId },
      data: { status: 'PENDING' },
    });
  }

  await prisma.expense.delete({ where: { id } });

  revalidatePath('/');
  revalidatePath('/expenses');
  revalidatePath('/analytics');
  return { success: true };
}

export async function duplicateExpense(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.expense.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error('Expense not found');

  const today = new Date();
  const activeCycle = await prisma.salaryMonth.findFirst({
    where: {
      userId: user.id,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  });

  const duplicated = await prisma.expense.create({
    data: {
      userId: user.id,
      salaryMonthId: activeCycle ? activeCycle.id : existing.salaryMonthId,
      categoryId: existing.categoryId,
      paymentMethodId: existing.paymentMethodId,
      amount: existing.amount,
      date: today,
      description: `${existing.description} (Copy)`,
      notes: existing.notes,
      isInvestment: existing.isInvestment,
    },
    include: { category: true, paymentMethod: true },
  });

  revalidatePath('/');
  revalidatePath('/expenses');
  return {
    ...duplicated,
    amount: Number(duplicated.amount),
    date: duplicated.date.toISOString(),
  };
}

export async function getExpenses(filters?: {
  salaryMonthId?: string;
  categoryId?: string;
  paymentMethodId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return [];

  const whereClause: any = { userId: user.id };

  if (filters?.salaryMonthId) {
    whereClause.salaryMonthId = filters.salaryMonthId;
  }
  if (filters?.categoryId && filters.categoryId !== 'all') {
    whereClause.categoryId = filters.categoryId;
  }
  if (filters?.paymentMethodId && filters.paymentMethodId !== 'all') {
    whereClause.paymentMethodId = filters.paymentMethodId;
  }
  if (filters?.startDate && filters?.endDate) {
    whereClause.date = {
      gte: new Date(filters.startDate),
      lte: new Date(filters.endDate),
    };
  }
  if (filters?.search && filters.search.trim()) {
    whereClause.OR = [
      { description: { contains: filters.search.trim(), mode: 'insensitive' } },
      { notes: { contains: filters.search.trim(), mode: 'insensitive' } },
    ];
  }

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    orderBy: { date: 'desc' },
    include: {
      category: true,
      paymentMethod: true,
      salaryMonth: { select: { id: true, name: true } },
    },
  });

  return expenses.map((e) => ({
    ...e,
    amount: Number(e.amount),
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));
}
