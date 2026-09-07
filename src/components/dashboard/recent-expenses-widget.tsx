'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { Receipt, ArrowRight } from 'lucide-react';

interface RecentExpensesWidgetProps {
  expenses: Array<{
    id: string;
    description: string;
    amount: number;
    date: string;
    isInvestment: boolean;
    category?: {
      name: string;
      icon: string;
      color: string;
    } | null;
    paymentMethod?: {
      name: string;
    } | null;
  }>;
  currency?: string;
  onOpenAddExpense: () => void;
}

export function RecentExpensesWidget({
  expenses,
  currency = 'Rs.',
  onOpenAddExpense,
}: RecentExpensesWidgetProps) {
  if (!expenses || expenses.length === 0) {
    return (
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Recent Expenses</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-xs text-muted-foreground">
            No expenses recorded yet in this salary cycle.
          </p>
          <button
            onClick={onOpenAddExpense}
            className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer tap-spring"
          >
            + Add your first expense
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-2xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
          <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Recent Expenses</span>
        </CardTitle>
        <Link
          href="/expenses"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 tap-spring"
        >
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {expenses.slice(0, 6).map((item) => {
          const formattedDate = format(parseISO(item.date), 'MMM d');

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: item.category?.color || '#10b981' }}
                >
                  <DynamicIcon name={item.category?.icon} size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                      {item.description}
                    </span>
                    {item.isInvestment && (
                      <Badge variant="investment" className="text-[9px] px-1 py-0">
                        SIP
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                    {item.category?.name || 'Expense'} &bull; {formattedDate}
                    {item.paymentMethod && ` &bull; ${item.paymentMethod.name}`}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  {formatCurrency(item.amount, currency)}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
