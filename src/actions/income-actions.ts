'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const incomeSchema = z.object({
  salaryMonthId: z.string().min(1),
  source: z.string().min(1), // Salary, Bonus, Freelance, Gift, Refund, Other
  amount: z.coerce.number().positive(),
  date: z.string().min(1),
  description: z.string().optional().nullable(),
});

export async function createIncome(formData: z.infer<typeof incomeSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = incomeSchema.parse(formData);
  const incomeDate = new Date(validated.date);

  const income = await prisma.income.create({
    data: {
      userId: user.id,
      salaryMonthId: validated.salaryMonthId,
      source: validated.source,
      amount: validated.amount,
      date: incomeDate,
      description: validated.description || null,
    },
  });

  // Recalculate totalIncome for the salary cycle
  const allIncomes = await prisma.income.findMany({
    where: { salaryMonthId: validated.salaryMonthId },
  });
  const newTotal = allIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

  await prisma.salaryMonth.update({
    where: { id: validated.salaryMonthId },
    data: { totalIncome: newTotal },
  });

  revalidatePath('/');
  revalidatePath('/salary-months');
  revalidatePath(`/salary-months/${validated.salaryMonthId}`);
  return {
    ...income,
    amount: Number(income.amount),
    date: income.date.toISOString(),
  };
}

export async function deleteIncome(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.income.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error('Income not found');

  const cycleId = existing.salaryMonthId;
  await prisma.income.delete({ where: { id } });

  // Recalculate totalIncome
  const allIncomes = await prisma.income.findMany({
    where: { salaryMonthId: cycleId },
  });
  const newTotal = allIncomes.reduce((sum, i) => sum + Number(i.amount), 0);

  await prisma.salaryMonth.update({
    where: { id: cycleId },
    data: { totalIncome: newTotal },
  });

  revalidatePath('/');
  revalidatePath('/salary-months');
  return { success: true };
}
