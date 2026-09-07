'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { formatCycleDateRange } from '@/lib/salary-cycle';
import { CalendarDays, Plus, ArrowRight, Wallet, TrendingUp, CheckCircle2 } from 'lucide-react';

interface CycleHistoryItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  normalExpenses: number;
  investments: number;
  saved: number;
  savingsRate: number;
  status: string;
  notes?: string | null;
}

interface SalaryHistoryViewProps {
  cycles: CycleHistoryItem[];
  currency?: string;
}

export function SalaryHistoryView({ cycles, currency = 'Rs.' }: SalaryHistoryViewProps) {
  const totalCumulativeSaved = cycles.reduce((sum, c) => sum + c.saved, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Salary Cycle History
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Review past salary cycles, expenses, savings rate, and financial progress.
          </p>
        </div>

        <Link href="/salary-months/new">
          <Button className="font-semibold gap-1.5 rounded-xl shadow-xs">
            <Plus className="w-4 h-4" />
            <span>New Salary Month</span>
          </Button>
        </Link>
      </div>

      {/* Summary Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Recorded Cycles
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">
              {cycles.length} Cycles
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs sm:col-span-2">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Cumulative Savings Retained
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(totalCumulativeSaved, currency)}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Income minus total living expenses across all tracked cycles
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cycles Timeline List */}
      <div className="space-y-3">
        {cycles.map((cycle) => {
          const rangeStr = formatCycleDateRange(cycle.startDate, cycle.endDate);
          const isActive = cycle.status === 'ACTIVE';

          return (
            <Link
              key={cycle.id}
              href={`/salary-months/${cycle.id}`}
              className="block group"
            >
              <Card
                className={`border transition-all hover:border-emerald-500/50 hover:shadow-sm ${
                  isActive
                    ? 'border-emerald-500/40 bg-white dark:bg-zinc-900 ring-1 ring-emerald-500/20'
                    : 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Cycle Name & Dates */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {cycle.name}
                      </h3>
                      {isActive ? (
                        <Badge variant="default" className="text-[10px] px-2 py-0.5">
                          Active Cycle
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          Closed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                      {rangeStr}
                    </p>
                    {cycle.notes && (
                      <p className="text-[11px] italic text-slate-400 dark:text-zinc-500">
                        "{cycle.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right: Income, Expenses, Saved */}
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-8 text-left sm:text-right text-xs">
                    <div>
                      <div className="text-slate-400 font-medium">Income</div>
                      <div className="font-bold text-slate-800 dark:text-zinc-200 text-sm mt-0.5">
                        {formatCurrency(cycle.totalIncome, currency)}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Expenses</div>
                      <div className="font-bold text-slate-800 dark:text-zinc-200 text-sm mt-0.5">
                        {formatCurrency(cycle.totalExpenses, currency)}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 font-medium">Saved</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                        {formatCurrency(cycle.saved, currency)}
                        <span className="text-[10px] font-normal text-slate-400 block sm:inline sm:ml-1">
                          ({cycle.savingsRate}%)
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
