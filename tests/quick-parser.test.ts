import { describe, it, expect } from 'vitest';
import { parseQuickExpense } from '../src/lib/quick-parser';

describe('Quick Expense Parser', () => {
  it('parses "450 Food"', () => {
    const result = parseQuickExpense('450 Food');
    expect(result.amount).toBe(450);
    expect(result.description).toBe('Food');
    expect(result.categoryHint).toBe('Food');
  });

  it('parses "Rs. 2,450 Groceries Cash"', () => {
    const result = parseQuickExpense('Rs. 2,450 Groceries Cash');
    expect(result.amount).toBe(2450);
    expect(result.paymentMethodHint).toBe('cash');
    expect(result.categoryHint).toBe('Groceries');
  });

  it('identifies investments like "SIP 3000"', () => {
    const result = parseQuickExpense('SIP 3000');
    expect(result.amount).toBe(3000);
    expect(result.isInvestment).toBe(true);
  });

  it('handles "180 Coffee"', () => {
    const result = parseQuickExpense('180 Coffee');
    expect(result.amount).toBe(180);
    expect(result.description).toBe('Coffee');
  });
});
