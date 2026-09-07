'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateSalaryCycleEnd, generateCycleName } from '@/lib/salary-cycle';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { filterApplicableRecurringExpenses } from '@/lib/recurring';

const salaryMonthSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  baseSalary: z.coerce.number().min(0),
  bonus: z.coerce.number().min(0).default(0),
  otherIncome: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'CLOSED', 'UPCOMING']).default('ACTIVE'),
  confirmRecurringIds: z.array(z.string()).optional(),
});

export async function createSalaryCycle(formData: z.infer<typeof salaryMonthSchema>) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const validated = salaryMonthSchema.parse(formData);
  const startDate = new Date(validated.startDate);
  const endDate = validated.endDate
    ? new Date(validated.endDate)
    : calculateSalaryCycleEnd(startDate);

  const name = validated.name || generateCycleName(startDate);
  const totalIncome = validated.baseSalary + validated.bonus + validated.otherIncome;

  // If status is ACTIVE, close previous active cycles
  if (validated.status === 'ACTIVE') {
    await prisma.salaryMonth.updateMany({
      where: { userId: user.id, status: 'ACTIVE' },
      data: { status: 'CLOSED' },
    });
  }

  const cycle = await prisma.salaryMonth.create({
    data: {
      userId: user.id,
      name,
      startDate,
      endDate,
      baseSalary: validated.baseSalary,
      bonus: validated.bonus,
      otherIncome: validated.otherIncome,
      totalIncome,
      notes: validated.notes,
      status: validated.status,
    },
  });

  // Automatically record the initial base salary as an Income record
  await prisma.income.create({
    data: {
      userId: user.id,
      salaryMonthId: cycle.id,
      source: 'Salary',
      amount: validated.baseSalary,
      date: startDate,
      description: 'Base Monthly Salary',
    },
  });

  if (validated.bonus > 0) {
    await prisma.income.create({
      data: {
        userId: user.id,
        salaryMonthId: cycle.id,
        source: 'Bonus',
        amount: validated.bonus,
        date: startDate,
        description: 'Salary Bonus',
      },
    });
  }

  if (validated.otherIncome > 0) {
    await prisma.income.create({
      data: {
        userId: user.id,
        salaryMonthId: cycle.id,
        source: 'Other',
        amount: validated.otherIncome,
        date: startDate,
        description: 'Other Initial Income',
      },
    });
  }

  // Populate Recurring Expense Instances idempotently
  const recurringRules = await prisma.recurringExpense.findMany({
    where: { userId: user.id, isEnabled: true },
  });

  const applicableRules = filterApplicableRecurringExpenses(
    recurringRules.map((r) => ({
      ...r,
      amount: Number(r.amount),
    })),
    startDate,
    endDate
  );

  const confirmedSet = new Set(validated.confirmRecurringIds || []);

  for (const rule of applicableRules) {
    const isSelected = confirmedSet.has(rule.id) || confirmedSet.size === 0;

    await prisma.recurringExpenseInstance.upsert({
      where: {
        recurringExpenseId_salaryMonthId: {
          recurringExpenseId: rule.id,
          salaryMonthId: cycle.id,
        },
      },
      update: {},
      create: {
        recurringExpenseId: rule.id,
        salaryMonthId: cycle.id,
        expectedDate: rule.expectedDate,
        amount: rule.amount,
        status: isSelected ? 'PENDING' : 'SKIPPED',
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/salary-months');
  revalidatePath('/expenses');
  return cycle;
}

export async function updateSalaryCycle(
  id: string,
  formData: Partial<z.infer<typeof salaryMonthSchema>>
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const existing = await prisma.salaryMonth.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) throw new Error('Salary cycle not found');

  const baseSalary = formData.baseSalary !== undefined ? formData.baseSalary : Number(existing.baseSalary);
  const bonus = formData.bonus !== undefined ? formData.bonus : Number(existing.bonus);
  const otherIncome = formData.otherIncome !== undefined ? formData.otherIncome : Number(existing.otherIncome);
  const totalIncome = baseSalary + bonus + otherIncome;

  const startDate = formData.startDate ? new Date(formData.startDate) : existing.startDate;
  const endDate = formData.endDate ? new Date(formData.endDate) : existing.endDate;

  const updated = await prisma.salaryMonth.update({
    where: { id },
    data: {
      name: formData.name || existing.name,
      startDate,
      endDate,
      baseSalary,
      bonus,
      otherIncome,
      totalIncome,
      notes: formData.notes !== undefined ? formData.notes : existing.notes,
      status: formData.status || existing.status,
    },
  });

  revalidatePath('/');
  revalidatePath('/salary-months');
  revalidatePath(`/salary-months/${id}`);
  return updated;
}

export async function getActiveSalaryCycle() {
  const user = await getCurrentUser();
  if (!user) return null;

  const today = new Date();

  // Find cycle where today is within startDate and endDate
  const cycleCoveringToday = await prisma.salaryMonth.findFirst({
    where: {
      userId: user.id,
      startDate: { lte: today },
      endDate: { gte: today },
    },
    orderBy: { startDate: 'desc' },
    include: {
      expenses: {
        include: { category: true, paymentMethod: true },
        orderBy: { date: 'desc' },
      },
      incomes: {
        orderBy: { date: 'desc' },
      },
      budgets: {
        include: { category: true },
      },
      recurringInstances: {
        include: { recurringExpense: true },
        orderBy: { expectedDate: 'asc' },
      },
    },
  });

  if (cycleCoveringToday) {
    return serializeCycle(cycleCoveringToday);
  }

  // Fallback to most recent ACTIVE cycle
  const activeCycle = await prisma.salaryMonth.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    orderBy: { startDate: 'desc' },
    include: {
      expenses: {
        include: { category: true, paymentMethod: true },
        orderBy: { date: 'desc' },
      },
      incomes: {
        orderBy: { date: 'desc' },
      },
      budgets: {
        include: { category: true },
      },
      recurringInstances: {
        include: { recurringExpense: true },
        orderBy: { expectedDate: 'asc' },
      },
    },
  });

  return activeCycle ? serializeCycle(activeCycle) : null;
}

export async function getLightweightActiveCycle(userId: string) {
  const today = new Date();
  const cycle =
    (await prisma.salaryMonth.findFirst({
      where: {
        userId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'desc' },
    })) ||
    (await prisma.salaryMonth.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { startDate: 'desc' },
    }));

  if (!cycle) return null;

  return {
    id: cycle.id,
    name: cycle.name,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
  };
}

export async function getAllSalaryCycles() {
  const user = await getCurrentUser();
  if (!user) return [];

  const cycles = await prisma.salaryMonth.findMany({
    where: { userId: user.id },
    orderBy: { startDate: 'desc' },
    include: {
      expenses: {
        select: { amount: true, isInvestment: true },
      },
      incomes: {
        select: { amount: true },
      },
    },
  });

  return cycles.map((c) => {
    const totalExpenses = c.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const normalExpenses = c.expenses
      .filter((e) => !e.isInvestment)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const investments = c.expenses
      .filter((e) => e.isInvestment)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const incomeTotal = Number(c.totalIncome);
    const saved = incomeTotal - totalExpenses;
    const savingsRate = incomeTotal > 0 ? Math.round((saved / incomeTotal) * 100) : 0;

    return {
      id: c.id,
      name: c.name,
      startDate: c.startDate.toISOString(),
      endDate: c.endDate.toISOString(),
      baseSalary: Number(c.baseSalary),
      bonus: Number(c.bonus),
      otherIncome: Number(c.otherIncome),
      totalIncome: incomeTotal,
      totalExpenses,
      normalExpenses,
      investments,
      saved,
      savingsRate,
      status: c.status,
      notes: c.notes,
    };
  });
}

export async function getSalaryCycleById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const cycle = await prisma.salaryMonth.findFirst({
    where: { id, userId: user.id },
    include: {
      expenses: {
        include: { category: true, paymentMethod: true },
        orderBy: { date: 'desc' },
      },
      incomes: {
        orderBy: { date: 'desc' },
      },
      budgets: {
        include: { category: true },
      },
      recurringInstances: {
        include: { recurringExpense: true },
        orderBy: { expectedDate: 'asc' },
      },
    },
  });

  return cycle ? serializeCycle(cycle) : null;
}

// Helper to convert Prisma Decimal values to numbers for client safety
function serializeCycle(cycle: any) {
  return {
    ...cycle,
    baseSalary: Number(cycle.baseSalary),
    bonus: Number(cycle.bonus),
    otherIncome: Number(cycle.otherIncome),
    totalIncome: Number(cycle.totalIncome),
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString(),
    expenses: cycle.expenses.map((e: any) => ({
      ...e,
      amount: Number(e.amount),
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    incomes: cycle.incomes.map((i: any) => ({
      ...i,
      amount: Number(i.amount),
      date: i.date.toISOString(),
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
    budgets: cycle.budgets.map((b: any) => ({
      ...b,
      amount: Number(b.amount),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    })),
    recurringInstances: cycle.recurringInstances.map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      expectedDate: r.expectedDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      recurringExpense: {
        ...r.recurringExpense,
        amount: Number(r.recurringExpense.amount),
      },
    })),
  };
}
