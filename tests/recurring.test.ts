import { describe, it, expect } from 'vitest';
import {
  calculateRecurringDateInCycle,
  filterApplicableRecurringExpenses,
} from '../src/lib/recurring';
import { format } from 'date-fns';

describe('Recurring Expense Cycle Resolution', () => {
  const cycleStart = new Date(2026, 8, 5); // Sep 5, 2026
  const cycleEnd = new Date(2026, 9, 4);   // Oct 4, 2026

  it('places 10th of month inside Sep 5 -> Oct 4 as Sep 10', () => {
    const date = calculateRecurringDateInCycle(10, cycleStart, cycleEnd);
    expect(format(date, 'yyyy-MM-dd')).toBe('2026-09-10');
  });

  it('places 2nd of month inside Sep 5 -> Oct 4 as Oct 2', () => {
    const date = calculateRecurringDateInCycle(2, cycleStart, cycleEnd);
    expect(format(date, 'yyyy-MM-dd')).toBe('2026-10-02');
  });

  it('handles 31st of month when month ends earlier', () => {
    // September has only 30 days
    const date = calculateRecurringDateInCycle(31, cycleStart, cycleEnd);
    expect(format(date, 'yyyy-MM-dd')).toBe('2026-09-30');
  });

  it('filters active recurring expenses within valid date range', () => {
    const rules = [
      {
        id: 'r1',
        name: 'Internet',
        amount: 1500,
        frequency: 'MONTHLY',
        dayOfMonth: 7,
        startDate: new Date(2026, 0, 1),
        isEnabled: true,
        isInvestment: false,
        categoryId: 'c1',
      },
      {
        id: 'r2',
        name: 'Gym (Cancelled)',
        amount: 2500,
        frequency: 'MONTHLY',
        dayOfMonth: 12,
        startDate: new Date(2026, 0, 1),
        isEnabled: false, // disabled
        isInvestment: false,
        categoryId: 'c2',
      },
      {
        id: 'r3',
        name: 'SIP',
        amount: 3000,
        frequency: 'MONTHLY',
        dayOfMonth: 10,
        startDate: new Date(2026, 0, 1),
        isEnabled: true,
        isInvestment: true,
        categoryId: 'c3',
      },
    ];

    const applicable = filterApplicableRecurringExpenses(rules, cycleStart, cycleEnd);
    expect(applicable.length).toBe(2);
    expect(applicable[0].name).toBe('Internet');
    expect(format(applicable[0].expectedDate, 'yyyy-MM-dd')).toBe('2026-09-07');
    expect(applicable[1].name).toBe('SIP');
    expect(format(applicable[1].expectedDate, 'yyyy-MM-dd')).toBe('2026-09-10');
  });
});
