import { getActiveSalaryCycle, getAllSalaryCycles, getSalaryCycleById } from '@/actions/salary-actions';
import { getCurrentUser } from '@/lib/auth';
import { AnalyticsView } from '@/components/analytics/analytics-view';
import { format, parseISO, eachDayOfInterval, startOfDay, isBefore, isSameDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const [user, activeCycle, allCycles] = await Promise.all([
    getCurrentUser(),
    getActiveSalaryCycle(),
    getAllSalaryCycles(),
  ]);

  if (!activeCycle) {
    return (
      <AnalyticsView
        currentCycle={null}
        previousCycle={null}
        salaryCycles={[]}
        categorySpending={[]}
        paymentMethodSpending={[]}
        timelineData={[]}
        savingsHistory={[]}
        categoryTrends={[]}
        investmentsTotal={0}
        normalSpendingTotal={0}
        currency={user?.currency || 'Rs.'}
      />
    );
  }

  // Find previous cycle
  const previousCycleSummary = allCycles.find((c) => c.id !== activeCycle.id);
  const previousCycleDetails = previousCycleSummary
    ? await getSalaryCycleById(previousCycleSummary.id)
    : null;

  // 1. Category Spending for current cycle
  const catMap = new Map<string, { amount: number; color: string; icon: string }>();
  let investmentsTotal = 0;
  let normalSpendingTotal = 0;

  for (const exp of activeCycle.expenses || []) {
    const catName = exp.category?.name || 'Other';
    const color = exp.category?.color || '#10b981';
    const icon = exp.category?.icon || 'Tag';
    const current = catMap.get(catName) || { amount: 0, color, icon };
    catMap.set(catName, { ...current, amount: current.amount + exp.amount });

    if (exp.isInvestment) {
      investmentsTotal += exp.amount;
    } else {
      normalSpendingTotal += exp.amount;
    }
  }

  const categorySpending = Array.from(catMap.entries())
    .map(([name, val]) => ({
      name,
      amount: val.amount,
      color: val.color,
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Payment Method Spending
  const pmMap = new Map<string, number>();
  for (const exp of activeCycle.expenses || []) {
    const pmName = exp.paymentMethod?.name || 'Cash';
    pmMap.set(pmName, (pmMap.get(pmName) || 0) + exp.amount);
  }

  const paymentMethodSpending = Array.from(pmMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      color: '#059669',
    }))
    .sort((a, b) => b.amount - a.amount);

  // 3. Spending Timeline (Cumulative actual vs linear budget)
  const cycleStart = parseISO(activeCycle.startDate);
  const cycleEnd = parseISO(activeCycle.endDate);
  const totalDays = Math.max(1, Math.round((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const dailyTarget = activeCycle.totalIncome / totalDays;

  // Group active cycle expenses by calendar day
  const dailySpendMap = new Map<string, number>();
  for (const exp of activeCycle.expenses || []) {
    const dayStr = format(parseISO(exp.date), 'MMM d');
    dailySpendMap.set(dayStr, (dailySpendMap.get(dayStr) || 0) + exp.amount);
  }

  const daysInterval = eachDayOfInterval({
    start: cycleStart,
    end: isBefore(new Date(), cycleEnd) ? new Date() : cycleEnd,
  });

  let runningTotal = 0;
  let dayIndex = 1;
  const timelineData = daysInterval.map((d) => {
    const dayStr = format(d, 'MMM d');
    const daySpent = dailySpendMap.get(dayStr) || 0;
    runningTotal += daySpent;

    const budgetGuideline = Math.round(dailyTarget * dayIndex);
    dayIndex++;

    return {
      day: dayStr,
      actualSpent: runningTotal,
      budgetGuideline,
    };
  });

  // 4. Savings History across past cycles
  const savingsHistory = allCycles
    .slice(0, 6)
    .reverse()
    .map((c) => ({
      cycleName: c.name.split(' ')[0] || c.name,
      saved: c.saved,
      income: c.totalIncome,
      expenses: c.totalExpenses,
    }));

  // 5. Category Trends (Current vs Previous)
  const prevCatMap = new Map<string, number>();
  if (previousCycleDetails) {
    for (const exp of previousCycleDetails.expenses || []) {
      const name = exp.category?.name || 'Other';
      prevCatMap.set(name, (prevCatMap.get(name) || 0) + exp.amount);
    }
  }

  const allCategoryNames = Array.from(
    new Set([...Array.from(catMap.keys()), ...Array.from(prevCatMap.keys())])
  );

  const categoryTrends = allCategoryNames
    .map((name) => {
      const current = catMap.get(name)?.amount || 0;
      const prev = prevCatMap.get(name) || 0;
      const color = catMap.get(name)?.color || '#94a3b8';
      const icon = catMap.get(name)?.icon || 'Tag';

      let percentageChange: number | null = null;
      if (prev > 0) {
        percentageChange = Math.round(((current - prev) / prev) * 100);
      } else if (current > 0) {
        percentageChange = 100;
      }

      return {
        name,
        color,
        icon,
        currentAmount: current,
        previousAmount: prev,
        percentageChange,
      };
    })
    .filter((c) => c.currentAmount > 0 || c.previousAmount > 0)
    .sort((a, b) => b.currentAmount - a.currentAmount);

  return (
    <AnalyticsView
      currentCycle={activeCycle}
      previousCycle={previousCycleDetails}
      salaryCycles={allCycles}
      categorySpending={categorySpending}
      paymentMethodSpending={paymentMethodSpending}
      timelineData={timelineData}
      savingsHistory={savingsHistory}
      categoryTrends={categoryTrends}
      investmentsTotal={investmentsTotal}
      normalSpendingTotal={normalSpendingTotal}
      currency={user?.currency || 'Rs.'}
    />
  );
}
