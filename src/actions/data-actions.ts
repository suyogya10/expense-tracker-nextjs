'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

export async function exportAllDataJSON() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const [salaryMonths, incomes, categories, paymentMethods, expenses, recurringExpenses, budgets] =
    await Promise.all([
      prisma.salaryMonth.findMany({ where: { userId: user.id } }),
      prisma.income.findMany({ where: { userId: user.id } }),
      prisma.category.findMany({ where: { userId: user.id } }),
      prisma.paymentMethod.findMany({ where: { userId: user.id } }),
      prisma.expense.findMany({
        where: { userId: user.id },
        include: { category: true, paymentMethod: true, salaryMonth: true },
      }),
      prisma.recurringExpense.findMany({ where: { userId: user.id } }),
      prisma.budget.findMany({ where: { userId: user.id } }),
    ]);

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
      currency: user.currency,
      timezone: user.timezone,
    },
    salaryMonths,
    incomes,
    categories,
    paymentMethods,
    expenses,
    recurringExpenses,
    budgets,
  };
}

export async function exportExpensesCSV() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const expenses = await prisma.expense.findMany({
    where: { userId: user.id },
    include: { category: true, paymentMethod: true, salaryMonth: true },
    orderBy: { date: 'desc' },
  });

  const headers = ['Date', 'Salary Cycle', 'Category', 'Description', 'Amount', 'Payment Method', 'Type', 'Notes'];
  const rows = expenses.map((e) => [
    format(e.date, 'yyyy-MM-dd'),
    `"${(e.salaryMonth?.name || '').replace(/"/g, '""')}"`,
    `"${(e.category?.name || '').replace(/"/g, '""')}"`,
    `"${(e.description || '').replace(/"/g, '""')}"`,
    Number(e.amount).toFixed(2),
    `"${(e.paymentMethod?.name || 'Unspecified').replace(/"/g, '""')}"`,
    e.isInvestment ? 'Investment' : 'Normal',
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csvContent;
}

export async function updateUserProfile(data: {
  name?: string;
  currency?: string;
  timezone?: string;
  defaultSalary?: number;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name?.trim(),
      currency: data.currency?.trim(),
      timezone: data.timezone?.trim(),
      defaultSalary: data.defaultSalary !== undefined ? data.defaultSalary : undefined,
    },
  });

  revalidatePath('/');
  revalidatePath('/settings');
  return updated;
}
