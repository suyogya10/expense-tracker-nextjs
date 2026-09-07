'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { calculateBudgetStatus } from '@/lib/salary-cycle';

export async function upsertBudget(
  salaryMonthId: string,
  categoryId: string,
  amount: number
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const budget = await prisma.budget.upsert({
    where: {
      salaryMonthId_categoryId: {
        salaryMonthId,
        categoryId,
      },
    },
    update: {
      amount,
    },
    create: {
      userId: user.id,
      salaryMonthId,
      categoryId,
      amount,
    },
    include: { category: true },
  });

  revalidatePath('/');
  revalidatePath('/budgets');
  return {
    ...budget,
    amount: Number(budget.amount),
  };
}

export async function deleteBudget(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await prisma.budget.delete({
    where: { id, userId: user.id },
  });

  revalidatePath('/');
  revalidatePath('/budgets');
  return { success: true };
}

export async function getCycleBudgets(salaryMonthId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: { salaryMonthId, userId: user.id },
      include: { category: true },
    }),
    prisma.expense.findMany({
      where: { salaryMonthId, userId: user.id },
      select: { categoryId: true, amount: true },
    }),
  ]);

  // Aggregate spending per category
  const spendingMap = new Map<string, number>();
  for (const exp of expenses) {
    const prev = spendingMap.get(exp.categoryId) || 0;
    spendingMap.set(exp.categoryId, prev + Number(exp.amount));
  }

  return budgets.map((b) => {
    const budgetAmount = Number(b.amount);
    const spentAmount = spendingMap.get(b.categoryId) || 0;
    const status = calculateBudgetStatus(budgetAmount, spentAmount);

    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryIcon: b.category.icon,
      categoryColor: b.category.color,
      budgetAmount,
      spentAmount,
      percentage: status.percentage,
      remainingAmount: status.remainingAmount,
      alertLevel: status.alertLevel,
    };
  });
}
