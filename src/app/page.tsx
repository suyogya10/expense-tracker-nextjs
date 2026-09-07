import { getActiveSalaryCycle } from '@/actions/salary-actions';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateCycleProgress, calculateFinancialBalances } from '@/lib/salary-cycle';
import { generateSmartInsights } from '@/lib/insights';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [user, activeCycle] = await Promise.all([
    getCurrentUser(),
    getActiveSalaryCycle(),
  ]);

  if (!activeCycle) {
    return (
      <DashboardView
        cycle={null}
        metrics={{ totalDays: 30, daysElapsed: 0, daysRemaining: 30, percentElapsed: 0 }}
        balances={{
          totalIncome: 0,
          normalSpending: 0,
          investments: 0,
          totalOutflow: 0,
          currentBalance: 0,
          upcomingCommitments: 0,
          availableBalance: 0,
          percentSpent: 0,
          averageDailySpending: 0,
          remainingDailyBudget: 0,
        }}
        insights={[]}
        currency={user?.currency || 'Rs.'}
      />
    );
  }

  // 1. Cycle Progress metrics
  const metrics = calculateCycleProgress(activeCycle.startDate, activeCycle.endDate);

  // 2. Pending recurring commitments
  const pendingCommitments = (activeCycle.recurringInstances || [])
    .filter((i: any) => i.status === 'PENDING')
    .reduce((sum: number, i: any) => sum + Number(i.amount), 0);

  // 3. Financial Balances
  const balances = calculateFinancialBalances({
    baseSalary: activeCycle.baseSalary,
    bonus: activeCycle.bonus,
    otherIncome: activeCycle.otherIncome,
    extraIncomesTotal: (activeCycle.incomes || [])
      .filter((i: any) => i.source !== 'Salary' && i.source !== 'Bonus')
      .reduce((sum: number, i: any) => sum + Number(i.amount), 0),
    expenses: activeCycle.expenses || [],
    upcomingCommitments: pendingCommitments,
    daysElapsed: metrics.daysElapsed,
    daysRemaining: metrics.daysRemaining,
  });

  // 4. Find Top Category for Insights
  const categorySpendingMap = new Map<string, number>();
  for (const exp of activeCycle.expenses || []) {
    const catName = exp.category?.name || 'Other';
    categorySpendingMap.set(catName, (categorySpendingMap.get(catName) || 0) + exp.amount);
  }

  let topCategory: { name: string; amount: number; percentage: number } | undefined;
  if (balances.totalOutflow > 0 && categorySpendingMap.size > 0) {
    const sorted = Array.from(categorySpendingMap.entries()).sort((a, b) => b[1] - a[1]);
    const [name, amount] = sorted[0];
    topCategory = {
      name,
      amount,
      percentage: Math.round((amount / balances.totalOutflow) * 100),
    };
  }

  // 5. Previous month outflow comparison (lightweight single-row query)
  const previousCycle = user
    ? await prisma.salaryMonth.findFirst({
        where: {
          userId: user.id,
          id: { not: activeCycle.id },
        },
        orderBy: { startDate: 'desc' },
        select: {
          expenses: {
            select: { amount: true },
          },
        },
      })
    : null;

  const previousMonthOutflow = previousCycle
    ? previousCycle.expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    : undefined;

  // 6. Generate Smart Insights
  const insights = generateSmartInsights({
    percentSpent: balances.percentSpent,
    percentElapsed: metrics.percentElapsed,
    totalIncome: balances.totalIncome,
    totalOutflow: balances.totalOutflow,
    currentBalance: balances.currentBalance,
    availableBalance: balances.availableBalance,
    averageDailySpending: balances.averageDailySpending,
    daysRemaining: metrics.daysRemaining,
    currency: user?.currency || 'Rs.',
    topCategory,
    previousMonthOutflow,
  });

  return (
    <DashboardView
      cycle={activeCycle}
      metrics={metrics}
      balances={balances}
      insights={insights}
      currency={user?.currency || 'Rs.'}
    />
  );
}
