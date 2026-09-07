import {
  startOfDay,
  setDate,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  getDaysInMonth,
} from 'date-fns';

export interface RecurringRule {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  dayOfMonth?: number | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  isEnabled: boolean;
  isInvestment: boolean;
  categoryId: string;
  paymentMethodId?: string | null;
}

/**
 * Calculates the expected transaction date for a monthly recurring expense within a salary cycle.
 * For example:
 * Cycle: Sep 5 to Oct 4.
 * Recurring: dayOfMonth = 10 -> Sep 10.
 * Recurring: dayOfMonth = 2 -> Oct 2.
 * If dayOfMonth exceeds days in month (e.g. 31 in Feb), clamps to max days in month.
 */
export function calculateRecurringDateInCycle(
  dayOfMonth: number | null | undefined,
  cycleStartDateInput: Date | string,
  cycleEndDateInput: Date | string
): Date {
  const cycleStart = startOfDay(
    typeof cycleStartDateInput === 'string' ? parseISO(cycleStartDateInput) : cycleStartDateInput
  );
  const cycleEnd = startOfDay(
    typeof cycleEndDateInput === 'string' ? parseISO(cycleEndDateInput) : cycleEndDateInput
  );

  const targetDay = dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31 ? dayOfMonth : cycleStart.getDate();

  // Try candidate 1: same month & year as cycle start
  const maxDaysStartMonth = getDaysInMonth(cycleStart);
  const day1 = Math.min(targetDay, maxDaysStartMonth);
  const candidate1 = setDate(cycleStart, day1);

  if (
    (isSameDay(candidate1, cycleStart) || isAfter(candidate1, cycleStart)) &&
    (isSameDay(candidate1, cycleEnd) || isBefore(candidate1, cycleEnd))
  ) {
    return candidate1;
  }

  // Try candidate 2: month & year of cycle end
  const maxDaysEndMonth = getDaysInMonth(cycleEnd);
  const day2 = Math.min(targetDay, maxDaysEndMonth);
  const candidate2 = setDate(cycleEnd, day2);

  if (
    (isSameDay(candidate2, cycleStart) || isAfter(candidate2, cycleStart)) &&
    (isSameDay(candidate2, cycleEnd) || isBefore(candidate2, cycleEnd))
  ) {
    return candidate2;
  }

  // Fallback to start of cycle if target day cannot be resolved
  return cycleStart;
}

/**
 * Filters recurring expenses that apply to a specific salary cycle:
 * 1. Must be enabled.
 * 2. Rule startDate <= cycleEndDate.
 * 3. Rule endDate (if set) >= cycleStartDate.
 */
export function filterApplicableRecurringExpenses(
  rules: RecurringRule[],
  cycleStartDateInput: Date | string,
  cycleEndDateInput: Date | string
): Array<RecurringRule & { expectedDate: Date }> {
  const cycleStart = startOfDay(
    typeof cycleStartDateInput === 'string' ? parseISO(cycleStartDateInput) : cycleStartDateInput
  );
  const cycleEnd = startOfDay(
    typeof cycleEndDateInput === 'string' ? parseISO(cycleEndDateInput) : cycleEndDateInput
  );

  const results: Array<RecurringRule & { expectedDate: Date }> = [];

  for (const rule of rules) {
    if (!rule.isEnabled) continue;

    const ruleStart = startOfDay(
      typeof rule.startDate === 'string' ? parseISO(rule.startDate) : rule.startDate
    );
    if (isAfter(ruleStart, cycleEnd)) continue;

    if (rule.endDate) {
      const ruleEnd = startOfDay(
        typeof rule.endDate === 'string' ? parseISO(rule.endDate) : rule.endDate
      );
      if (isBefore(ruleEnd, cycleStart)) continue;
    }

    const expectedDate = calculateRecurringDateInCycle(rule.dayOfMonth, cycleStart, cycleEnd);
    results.push({
      ...rule,
      expectedDate,
    });
  }

  return results.sort((a, b) => a.expectedDate.getTime() - b.expectedDate.getTime());
}
