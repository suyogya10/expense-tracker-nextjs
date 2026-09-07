'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryDonutChart } from './category-donut-chart';
import { SpendingTrendChart } from './spending-trend-chart';
import { SavingsHistoryChart } from './savings-history-chart';
import { CategoryTrendsTable } from './category-trends-table';
import { formatCurrency } from '@/lib/currency';
import { PieChart, TrendingUp, Wallet, Landmark, Layers } from 'lucide-react';

interface AnalyticsViewProps {
  currentCycle: any | null;
  previousCycle: any | null;
  salaryCycles: any[];
  categorySpending: Array<{ name: string; amount: number; color: string }>;
  paymentMethodSpending: Array<{ name: string; amount: number; color: string }>;
  timelineData: Array<{ day: string; actualSpent: number; budgetGuideline: number }>;
  savingsHistory: Array<{ cycleName: string; saved: number; income: number; expenses: number }>;
  categoryTrends: any[];
  investmentsTotal: number;
  normalSpendingTotal: number;
  currency?: string;
}

export function AnalyticsView({
  currentCycle,
  categorySpending,
  paymentMethodSpending,
  timelineData,
  savingsHistory,
  categoryTrends,
  investmentsTotal,
  normalSpendingTotal,
  currency = 'Rs.',
}: AnalyticsViewProps) {
  if (!currentCycle) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Please create a salary cycle to view financial analytics.
        </p>
      </div>
    );
  }

  const totalSpent = normalSpendingTotal + investmentsTotal;
  const income = currentCycle.totalIncome || 0;
  const saved = income - totalSpent;
  const savingsRate = income > 0 ? Math.max(0, Math.round((saved / income) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          Financial Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          In-depth spending breakdowns, trends, and cycle savings for {currentCycle.name}
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Outflow
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
              {formatCurrency(totalSpent, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Cycle Income
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(income, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Saved
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
              {formatCurrency(saved, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Savings Rate
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {savingsRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Category Donut & Spending Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Spending by Category</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonutChart data={categorySpending} currency={currency} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 max-h-36 overflow-y-auto no-scrollbar">
              {categorySpending.map((cat) => {
                const pct = totalSpent > 0 ? Math.round((cat.amount / totalSpent) * 100) : 0;
                return (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="truncate text-slate-600 dark:text-slate-400">
                      {cat.name}: <strong className="text-slate-800 dark:text-slate-200">{pct}%</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Spending Pace */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Cumulative Spending vs Budget Pace</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SpendingTrendChart data={timelineData} currency={currency} />
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-indigo-600 rounded-full" />
                <span>Actual Cumulative</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
                <span>Linear Budget Pace</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Category Trends & Historical Cycle Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Trends Comparison */}
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Category Trends (vs. Previous Cycle)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryTrendsTable trends={categoryTrends} currency={currency} />
          </CardContent>
        </Card>

        {/* Historical Savings */}
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>Salary Cycle Savings History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SavingsHistoryChart data={savingsHistory} currency={currency} />
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Payment Methods & Investments vs Consumed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Payment Methods Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentMethodSpending.map((pm) => {
              const pct = totalSpent > 0 ? Math.round((pm.amount / totalSpent) * 100) : 0;
              return (
                <div key={pm.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{pm.name}</span>
                    <span className="text-slate-500">
                      {formatCurrency(pm.amount, currency)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Normal Spending vs Investment Outflows */}
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span>Consumption vs. Investments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black border border-transparent dark:border-zinc-800 flex justify-between items-center">
              <div>
                <div className="text-xs text-slate-500 font-medium">Standard Living Expenses</div>
                <div className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                  {formatCurrency(normalSpendingTotal, currency)}
                </div>
              </div>
              <div className="text-right text-xs font-semibold text-slate-500">
                {totalSpent > 0 ? Math.round((normalSpendingTotal / totalSpent) * 100) : 0}% of outflow
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-900/40 flex justify-between items-center">
              <div>
                <div className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                  Investments / SIP / Assets
                </div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                  {formatCurrency(investmentsTotal, currency)}
                </div>
              </div>
              <div className="text-right text-xs font-semibold text-purple-700 dark:text-purple-400">
                {totalSpent > 0 ? Math.round((investmentsTotal / totalSpent) * 100) : 0}% of outflow
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
