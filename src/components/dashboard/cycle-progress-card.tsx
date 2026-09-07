'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCycleDateRange } from '@/lib/salary-cycle';
import { Calendar, Clock } from 'lucide-react';

interface CycleProgressCardProps {
  cycleName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
  percentElapsed: number;
  percentSpent: number;
}

export function CycleProgressCard({
  cycleName,
  startDate,
  endDate,
  totalDays,
  daysElapsed,
  daysRemaining,
  percentElapsed,
  percentSpent,
}: CycleProgressCardProps) {
  const dateRangeStr = formatCycleDateRange(startDate, endDate);

  // Status message comparing spending vs time elapsed
  let statusBadge = {
    text: 'On Track 👍',
    colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  };

  const diff = percentElapsed - percentSpent;
  if (diff >= 10) {
    statusBadge = {
      text: 'Spending Slower Than Time 👍',
      colorClass: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    };
  } else if (diff <= -10) {
    statusBadge = {
      text: 'Spending Faster Than Time ⚠️',
      colorClass: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    };
  }

  return (
    <Card className="overflow-hidden border border-border shadow-sm bg-card text-card-foreground">
      <CardContent className="p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Current Financial Month</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-0.5">
              {cycleName}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              {dateRangeStr}
            </p>
          </div>

          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.colorClass}`}
          >
            {statusBadge.text}
          </div>
        </div>

        {/* Progress Bar & Day Counters */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Day {daysElapsed} of {totalDays}
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {percentElapsed}% of cycle elapsed
            </span>
          </div>

          <Progress
            value={percentElapsed}
            className="h-3 rounded-full bg-slate-100 dark:bg-slate-800"
            indicatorClassName="bg-indigo-600 dark:bg-indigo-500"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
            <span>{daysRemaining} days left until next salary</span>
            <span>
              Income spent:{' '}
              <strong className="text-slate-700 dark:text-zinc-200">
                {percentSpent}%
              </strong>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
