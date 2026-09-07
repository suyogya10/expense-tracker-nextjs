import { describe, it, expect } from 'vitest';
import {
  calculateSalaryCycleEnd,
  formatCycleDateRange,
  isDateInCycle,
  calculateCycleProgress,
  calculateFinancialBalances,
  calculateBudgetStatus,
} from '../src/lib/salary-cycle';
import { format } from 'date-fns';

describe('Salary Cycle Calculation', () => {
  it('calculates standard salary cycle: Sep 5, 2026 -> Oct 4, 2026', () => {
    const start = new Date(2026, 8, 5); // Sep 5, 2026
    const end = calculateSalaryCycleEnd(start);
    expect(format(end, 'yyyy-MM-dd')).toBe('2026-10-04');
  });

  it('calculates mid-month salary cycle: Jan 15, 2026 -> Feb 14, 2026', () => {
    const start = new Date(2026, 0, 15); // Jan 15, 2026
    const end = calculateSalaryCycleEnd(start);
    expect(format(end, 'yyyy-MM-dd')).toBe('2026-02-14');
  });

  it('handles Jan 31 in a regular non-leap year (2026)', () => {
    const start = new Date(2026, 0, 31); // Jan 31, 2026
    const end = calculateSalaryCycleEnd(start);
    // Jan 31 + 1 month in non-leap year = Feb 28; minus 1 day = Feb 27
    expect(format(end, 'yyyy-MM-dd')).toBe('2026-02-27');
  });

  it('handles Jan 31 in a leap year (2028)', () => {
    const start = new Date(2028, 0, 31); // Jan 31, 2028 (leap year)
    const end = calculateSalaryCycleEnd(start);
    // Jan 31 + 1 month in leap year = Feb 29; minus 1 day = Feb 28
    expect(format(end, 'yyyy-MM-dd')).toBe('2028-02-28');
  });

  it('handles Feb 15 in regular year -> Mar 14', () => {
    const start = new Date(2026, 1, 15); // Feb 15, 2026
    const end = calculateSalaryCycleEnd(start);
    expect(format(end, 'yyyy-MM-dd')).toBe('2026-03-14');
  });

  it('handles salary on 1st of month: Mar 1, 2026 -> Mar 31, 2026', () => {
    const start = new Date(2026, 2, 1); // Mar 1, 2026
    const end = calculateSalaryCycleEnd(start);
    expect(format(end, 'yyyy-MM-dd')).toBe('2026-03-31');
  });

  it('formats cycle date range cleanly', () => {
    const start = new Date(2026, 8, 5);
    const end = new Date(2026, 9, 4);
    expect(formatCycleDateRange(start, end)).toBe('Sep 5 – Oct 4, 2026');
  });

  it('correctly tests if a date is within a salary cycle', () => {
    const start = new Date(2026, 8, 5); // Sep 5
    const end = new Date(2026, 9, 4);   // Oct 4

    expect(isDateInCycle(new Date(2026, 8, 5), start, end)).toBe(true);  // boundary start
    expect(isDateInCycle(new Date(2026, 8, 20), start, end)).toBe(true); // middle
    expect(isDateInCycle(new Date(2026, 9, 4), start, end)).toBe(true);  // boundary end
    expect(isDateInCycle(new Date(2026, 8, 4), start, end)).toBe(false); // day before
    expect(isDateInCycle(new Date(2026, 9, 5), start, end)).toBe(false); // day after
  });

  it('computes cycle progress accurately', () => {
    const start = new Date(2026, 8, 5); // Sep 5 (30 days total until Oct 4)
    const end = new Date(2026, 9, 4);   // Oct 4
    const asOf = new Date(2026, 8, 21); // Day 17 of 30

    const progress = calculateCycleProgress(start, end, asOf);
    expect(progress.totalDays).toBe(30);
    expect(progress.daysElapsed).toBe(17);
    expect(progress.daysRemaining).toBe(13);
    expect(progress.percentElapsed).toBe(57); // 17/30 = 56.6% -> 57%
  });
});

describe('Financial Balances & Committed Money', () => {
  it('correctly calculates balances per user prompt example', () => {
    // Prompt example:
    // Income: Rs. 70,000 (Base 60,000 + Bonus 10,000)
    // Spent: Rs. 31,450
    // Upcoming Commitments: Rs. 8,500
    // Actually Available: Rs. 30,050
    const result = calculateFinancialBalances({
      baseSalary: 60000,
      bonus: 10000,
      otherIncome: 0,
      expenses: [
        { amount: 31450, isInvestment: false },
      ],
      upcomingCommitments: 8500,
      daysElapsed: 17,
      daysRemaining: 13,
    });

    expect(result.totalIncome).toBe(70000);
    expect(result.normalSpending).toBe(31450);
    expect(result.currentBalance).toBe(38550);
    expect(result.availableBalance).toBe(30050);
    expect(result.percentSpent).toBe(44.9);
  });

  it('handles investments distinction correctly', () => {
    const result = calculateFinancialBalances({
      baseSalary: 70000,
      expenses: [
        { amount: 38000, isInvestment: false },
        { amount: 10000, isInvestment: true },
      ],
      upcomingCommitments: 0,
    });

    expect(result.totalIncome).toBe(70000);
    expect(result.normalSpending).toBe(38000);
    expect(result.investments).toBe(10000);
    expect(result.totalOutflow).toBe(48000);
    expect(result.currentBalance).toBe(22000);
    expect(result.effectiveSavings).toBe(32000); // Income - normal spending
  });
});

describe('Budget Alerts Thresholds', () => {
  it('identifies safe budget (<75%)', () => {
    const status = calculateBudgetStatus(8000, 5000);
    expect(status.percentage).toBe(63);
    expect(status.alertLevel).toBe('safe');
  });

  it('identifies warning budget (>=75% and <90%)', () => {
    const status = calculateBudgetStatus(8000, 6200); // 77.5%
    expect(status.percentage).toBe(78);
    expect(status.alertLevel).toBe('warning');
  });

  it('identifies danger budget (>=90% and <100%)', () => {
    const status = calculateBudgetStatus(8000, 7400); // 92.5%
    expect(status.percentage).toBe(93);
    expect(status.alertLevel).toBe('danger');
  });

  it('identifies exceeded budget (>=100%)', () => {
    const status = calculateBudgetStatus(8000, 8500);
    expect(status.percentage).toBe(106);
    expect(status.alertLevel).toBe('exceeded');
  });
});
