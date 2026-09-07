'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarCheck2,
  TrendingUp,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface FinancialOverviewCardsProps {
  totalIncome: number;
  normalSpending: number;
  investments: number;
  totalOutflow: number;
  currentBalance: number;
  upcomingCommitments: number;
  availableBalance: number;
  averageDailySpending: number;
  remainingDailyBudget: number;
  currency?: string;
  percentSpent: number;
  daysRemaining: number;
}

export function FinancialOverviewCards({
  totalIncome,
  normalSpending,
  investments,
  totalOutflow,
  currentBalance,
  upcomingCommitments,
  availableBalance,
  averageDailySpending,
  remainingDailyBudget,
  currency = 'Rs.',
  percentSpent,
  daysRemaining,
}: FinancialOverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Actually Available Balance (Hero Card) */}
      <Card className="sm:col-span-2 relative overflow-hidden border border-indigo-500/30 bg-gradient-to-br from-indigo-600 via-indigo-800 to-black text-white shadow-lg shadow-indigo-600/20">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between text-indigo-100 text-xs font-semibold">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                Available Balance
              </span>
              <span className="text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-xs font-medium">
                Safe to spend
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2">
              {formatCurrency(availableBalance, currency)}
            </div>
          </div>

          <div className="pt-3 border-t border-white/15 text-xs text-indigo-50 space-y-1">
            <div className="flex justify-between items-center">
              <span>Current In-Hand Balance:</span>
              <span className="font-semibold">{formatCurrency(currentBalance, currency)}</span>
            </div>
            {upcomingCommitments > 0 && (
              <div className="flex justify-between items-center text-indigo-200">
                <span>- Upcoming Commitments:</span>
                <span className="font-semibold">-{formatCurrency(upcomingCommitments, currency)}</span>
              </div>
            )}
            <div className="text-[11px] text-indigo-200/90 pt-1 font-medium">
              {daysRemaining > 0
                ? `Allows approx. ${formatCurrency(remainingDailyBudget, currency)}/day for the next ${daysRemaining} days`
                : 'Cycle ending today'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Total Income */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {formatCurrency(totalIncome, currency)}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              100% of cycle funding
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Outflow (Spent + Investments) */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Outflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {formatCurrency(totalOutflow, currency)}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1 flex items-center justify-between">
              <span>{percentSpent}% of income</span>
              {investments > 0 && (
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  +{formatCurrency(investments, currency)} SIP
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Daily Pace Metrics */}
      <Card className="sm:col-span-2 lg:col-span-4 border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-black shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
            <div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Average Daily Spending
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                {formatCurrency(averageDailySpending, currency)}
                <span className="text-xs font-normal text-slate-500"> / day</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Remaining Daily Budget
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(remainingDailyBudget, currency)}
                <span className="text-xs font-normal text-slate-500"> / day</span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Normal Spending
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-zinc-100 mt-0.5">
                {formatCurrency(normalSpending, currency)}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                Investments &amp; Savings
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {formatCurrency(investments, currency)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
