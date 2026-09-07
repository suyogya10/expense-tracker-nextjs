import { formatCurrency } from './currency';

export interface SmartInsight {
  id: string;
  type: 'positive' | 'warning' | 'info' | 'neutral';
  title: string;
  message: string;
}

export function generateSmartInsights(params: {
  percentSpent: number;
  percentElapsed: number;
  totalIncome: number;
  totalOutflow: number;
  currentBalance: number;
  availableBalance: number;
  averageDailySpending: number;
  daysRemaining: number;
  currency?: string;
  topCategory?: { name: string; amount: number; percentage: number };
  previousMonthOutflow?: number;
  budgetWarnings?: Array<{ categoryName: string; percentage: number }>;
}): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const currency = params.currency || 'Rs.';

  // 1. Cycle pace insight
  if (params.totalIncome > 0) {
    const diff = params.percentElapsed - params.percentSpent;
    if (diff >= 10) {
      insights.push({
        id: 'pace-good',
        type: 'positive',
        title: 'Spending Pace',
        message: `You've spent ${params.percentSpent}% of your income while ${params.percentElapsed}% of your salary cycle has passed. You're pacing well 👍`,
      });
    } else if (diff <= -15) {
      insights.push({
        id: 'pace-fast',
        type: 'warning',
        title: 'Spending Alert',
        message: `You've spent ${params.percentSpent}% of your income, but only ${params.percentElapsed}% of your salary cycle has elapsed. Consider slowing down discretionary spending.`,
      });
    } else {
      insights.push({
        id: 'pace-balanced',
        type: 'neutral',
        title: 'Steady Pace',
        message: `Your spending (${params.percentSpent}%) is tracking in line with cycle time elapsed (${params.percentElapsed}%).`,
      });
    }
  }

  // 2. Projected end of cycle remaining balance
  if (params.daysRemaining > 0 && params.averageDailySpending > 0) {
    const projectedRemainingSpending = params.averageDailySpending * params.daysRemaining;
    const projectedEndBalance = params.availableBalance - projectedRemainingSpending;
    if (projectedEndBalance > 0) {
      insights.push({
        id: 'projection-positive',
        type: 'info',
        title: 'Projected Surplus',
        message: `At your average rate of ${formatCurrency(params.averageDailySpending, currency)}/day, you may finish this cycle with approx. ${formatCurrency(projectedEndBalance, currency)} remaining.`,
      });
    } else {
      insights.push({
        id: 'projection-deficit',
        type: 'warning',
        title: 'Projection Alert',
        message: `At your current pace of ${formatCurrency(params.averageDailySpending, currency)}/day, you could exceed your available funds by ${formatCurrency(Math.abs(projectedEndBalance), currency)} before the next salary.`,
      });
    }
  }

  // 3. Top category highlight
  if (params.topCategory && params.topCategory.percentage > 25) {
    insights.push({
      id: 'top-category',
      type: 'info',
      title: 'Top Category',
      message: `${params.topCategory.name} is your largest expense category so far, taking ${params.topCategory.percentage}% (${formatCurrency(params.topCategory.amount, currency)}) of your total spending.`,
    });
  }

  // 4. Budget warnings
  if (params.budgetWarnings && params.budgetWarnings.length > 0) {
    for (const bw of params.budgetWarnings.slice(0, 2)) {
      insights.push({
        id: `budget-${bw.categoryName}`,
        type: 'warning',
        title: 'Budget Alert',
        message: `You have used ${bw.percentage}% of your ${bw.categoryName} budget.`,
      });
    }
  }

  // 5. Month over month trend
  if (params.previousMonthOutflow && params.previousMonthOutflow > 0 && params.totalOutflow > 0) {
    const percentChange = Math.round(
      ((params.totalOutflow - params.previousMonthOutflow) / params.previousMonthOutflow) * 100
    );
    if (percentChange > 15) {
      insights.push({
        id: 'mom-increase',
        type: 'warning',
        title: 'Trend Notice',
        message: `Total outflow is currently ${percentChange}% higher than your previous salary cycle.`,
      });
    } else if (percentChange < -15) {
      insights.push({
        id: 'mom-decrease',
        type: 'positive',
        title: 'Savings Trend',
        message: `Total outflow is ${Math.abs(percentChange)}% lower compared to the previous salary cycle.`,
      });
    }
  }

  return insights;
}
