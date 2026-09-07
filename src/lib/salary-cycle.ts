import {
  addMonths,
  subDays,
  startOfDay,
  differenceInCalendarDays,
  format,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
} from 'date-fns';

/**
 * Calculates the default end date for a salary cycle given the start date.
 * Rule: Start Date + 1 month - 1 day
 * Examples:
 * - 2026-09-05 -> 2026-10-04
 * - 2026-01-15 -> 2026-02-14
 * - 2026-01-31 -> 2026-02-27 (2026 is not a leap year)
 * - 2028-01-31 -> 2028-02-28 (2028 is a leap year)
 */
export function calculateSalaryCycleEnd(startDateInput: Date | string): Date {
  const startDate = typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput;
  const nextMonth = addMonths(startDate, 1);
  return subDays(nextMonth, 1);
}

/**
 * Default human-friendly cycle name, e.g. "September 2026"
 */
export function generateCycleName(startDateInput: Date | string): string {
  const startDate = typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput;
  return format(startDate, 'MMMM yyyy');
}

/**
 * Formats a cycle date range into a clean string, e.g. "Sep 5 – Oct 4, 2026"
 */
export function formatCycleDateRange(
  startDateInput: Date | string,
  endDateInput: Date | string
): string {
  const start = typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput;
  const end = typeof endDateInput === 'string' ? parseISO(endDateInput) : endDateInput;
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameYear) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Checks whether a given target date falls within the start and end date of a salary cycle.
 */
export function isDateInCycle(
  targetDateInput: Date | string,
  startDateInput: Date | string,
  endDateInput: Date | string
): boolean {
  const target = startOfDay(typeof targetDateInput === 'string' ? parseISO(targetDateInput) : targetDateInput);
  const start = startOfDay(typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput);
  const end = startOfDay(typeof endDateInput === 'string' ? parseISO(endDateInput) : endDateInput);

  const isAtOrAfterStart = isSameDay(target, start) || isAfter(target, start);
  const isAtOrBeforeEnd = isSameDay(target, end) || isBefore(target, end);

  return isAtOrAfterStart && isAtOrBeforeEnd;
}

export interface CycleMetrics {
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  percentElapsed: number;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

/**
 * Computes progress of a salary cycle relative to a reference date (default: today).
 */
export function calculateCycleProgress(
  startDateInput: Date | string,
  endDateInput: Date | string,
  asOfDateInput: Date | string = new Date()
): CycleMetrics {
  const start = startOfDay(typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput);
  const end = startOfDay(typeof endDateInput === 'string' ? parseISO(endDateInput) : endDateInput);
  const asOf = startOfDay(typeof asOfDateInput === 'string' ? parseISO(asOfDateInput) : asOfDateInput);

  const totalDays = Math.max(1, differenceInCalendarDays(end, start) + 1);

  let daysElapsed = 0;
  let isPast = false;
  let isFuture = false;
  let isCurrent = false;

  if (isBefore(asOf, start)) {
    isFuture = true;
    daysElapsed = 0;
  } else if (isAfter(asOf, end)) {
    isPast = true;
    daysElapsed = totalDays;
  } else {
    isCurrent = true;
    daysElapsed = differenceInCalendarDays(asOf, start) + 1;
  }

  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const percentElapsed = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

  return {
    totalDays,
    daysElapsed,
    daysRemaining,
    percentElapsed,
    isCurrent,
    isPast,
    isFuture,
  };
}

export interface BalanceBreakdown {
  totalIncome: number;
  normalSpending: number;
  investments: number;
  totalOutflow: number;
  currentBalance: number;
  upcomingCommitments: number;
  availableBalance: number;
  savingsRate: number;
  effectiveSavings: number;
  percentSpent: number;
  averageDailySpending: number;
  remainingDailyBudget: number;
}

/**
 * Calculates core financial balances according to business definitions:
 * - Total Income = Base Salary + Bonus + Other Income + Extra Incomes
 * - Total Spending = Normal expenses
 * - Investments = Investment expenses
 * - Total Outflow = Normal Spending + Investments
 * - Current Balance = Total Income - Total Outflow
 * - Available Balance = Current Balance - Upcoming Commitments
 * - Savings Rate = (Current Balance / Total Income) * 100
 */
export function calculateFinancialBalances(params: {
  baseSalary: number;
  bonus?: number;
  otherIncome?: number;
  extraIncomesTotal?: number;
  expenses: Array<{ amount: number; isInvestment: boolean }>;
  upcomingCommitments?: number;
  daysElapsed?: number;
  daysRemaining?: number;
}): BalanceBreakdown {
  const baseSalary = Number(params.baseSalary) || 0;
  const bonus = Number(params.bonus) || 0;
  const otherIncome = Number(params.otherIncome) || 0;
  const extraIncomesTotal = Number(params.extraIncomesTotal) || 0;
  const upcomingCommitments = Number(params.upcomingCommitments) || 0;
  const daysElapsed = Math.max(1, params.daysElapsed ?? 1);
  const daysRemaining = Math.max(0, params.daysRemaining ?? 0);

  const totalIncome = baseSalary + bonus + otherIncome + extraIncomesTotal;

  let normalSpending = 0;
  let investments = 0;

  for (const exp of params.expenses) {
    const amt = Number(exp.amount) || 0;
    if (exp.isInvestment) {
      investments += amt;
    } else {
      normalSpending += amt;
    }
  }

  const totalOutflow = normalSpending + investments;
  const currentBalance = totalIncome - totalOutflow;
  const availableBalance = currentBalance - upcomingCommitments;

  const effectiveSavings = totalIncome - normalSpending;
  const savingsRate = totalIncome > 0 ? Math.max(0, (currentBalance / totalIncome) * 100) : 0;
  const percentSpent = totalIncome > 0 ? (totalOutflow / totalIncome) * 100 : 0;

  const averageDailySpending = daysElapsed > 0 ? totalOutflow / daysElapsed : 0;
  const remainingDailyBudget = daysRemaining > 0 ? Math.max(0, availableBalance / daysRemaining) : 0;

  return {
    totalIncome,
    normalSpending,
    investments,
    totalOutflow,
    currentBalance,
    upcomingCommitments,
    availableBalance,
    savingsRate: Math.round(savingsRate * 10) / 10,
    effectiveSavings,
    percentSpent: Math.round(percentSpent * 10) / 10,
    averageDailySpending: Math.round(averageDailySpending),
    remainingDailyBudget: Math.round(remainingDailyBudget),
  };
}

export type BudgetAlertLevel = 'safe' | 'warning' | 'danger' | 'exceeded';

export interface BudgetStatus {
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  remainingAmount: number;
  alertLevel: BudgetAlertLevel;
}

/**
 * Calculates budget status and triggers warnings at 75%, 90%, and 100%+
 */
export function calculateBudgetStatus(budgetAmount: number, spentAmount: number): BudgetStatus {
  const budget = Number(budgetAmount) || 0;
  const spent = Number(spentAmount) || 0;
  const percentage = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const remainingAmount = budget - spent;

  let alertLevel: BudgetAlertLevel = 'safe';
  if (percentage >= 100) {
    alertLevel = 'exceeded';
  } else if (percentage >= 90) {
    alertLevel = 'danger';
  } else if (percentage >= 75) {
    alertLevel = 'warning';
  }

  return {
    budgetAmount: budget,
    spentAmount: spent,
    percentage,
    remainingAmount,
    alertLevel,
  };
}
