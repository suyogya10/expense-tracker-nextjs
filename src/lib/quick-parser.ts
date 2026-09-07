export interface QuickParsedExpense {
  amount: number | null;
  description: string;
  categoryHint?: string;
  paymentMethodHint?: string;
  isInvestment?: boolean;
}

const COMMON_PAYMENT_METHODS = ['cash', 'bank', 'card', 'debit', 'credit', 'esewa', 'khalti'];
const INVESTMENT_KEYWORDS = ['sip', 'stocks', 'share', 'mutual fund', 'fd', 'fixed deposit', 'gold', 'crypto'];

export function parseQuickExpense(text: string): QuickParsedExpense {
  const trimmed = text.trim();
  if (!trimmed) {
    return { amount: null, description: '' };
  }

  // Find amount: matches numbers like 450, 450.50, Rs. 450, Rs 450, 4,500, 3000
  const amountMatch = trimmed.match(/(?:(?:rs\.?|npr)\s*)?((?:[0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\.[0-9]+)?)/i);
  
  let amount: number | null = null;
  let remainingText = trimmed;

  if (amountMatch) {
    const rawNum = amountMatch[1].replace(/,/g, '');
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
      // remove the matched amount segment from text
      remainingText = trimmed.replace(amountMatch[0], ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // Check payment method hint
  let paymentMethodHint: string | undefined;
  for (const pm of COMMON_PAYMENT_METHODS) {
    const regex = new RegExp(`\\b${pm}\\b`, 'i');
    if (regex.test(remainingText)) {
      paymentMethodHint = pm;
      remainingText = remainingText.replace(regex, '').replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // Check investment hint
  let isInvestment = false;
  for (const inv of INVESTMENT_KEYWORDS) {
    const regex = new RegExp(`\\b${inv}\\b`, 'i');
    if (regex.test(trimmed)) {
      isInvestment = true;
      break;
    }
  }

  // Category hint or description
  const description = remainingText || (amount ? `Expense Rs. ${amount}` : 'Expense');
  const categoryHint = remainingText.split(' ')[0] || undefined;

  return {
    amount,
    description,
    categoryHint,
    paymentMethodHint,
    isInvestment,
  };
}
