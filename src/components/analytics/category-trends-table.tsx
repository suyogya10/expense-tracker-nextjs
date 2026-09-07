'use client';

import React from 'react';
import { formatCurrency } from '@/lib/currency';
import { DynamicIcon } from '@/components/dynamic-icon';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface CategoryTrendItem {
  name: string;
  icon: string;
  color: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number | null;
}

interface CategoryTrendsTableProps {
  trends: CategoryTrendItem[];
  currency?: string;
}

export function CategoryTrendsTable({ trends, currency = 'Rs.' }: CategoryTrendsTableProps) {
  if (!trends || trends.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        Not enough historical cycle data to compute trends yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 uppercase tracking-wider font-semibold">
          <tr>
            <th className="pb-3 pl-2">Category</th>
            <th className="pb-3 text-right">Current Cycle</th>
            <th className="pb-3 text-right">Previous Cycle</th>
            <th className="pb-3 pr-2 text-right">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
          {trends.map((item) => {
            const hasChange = item.percentageChange !== null;
            const isIncrease = (item.percentageChange ?? 0) > 0;
            const isNeutral = item.percentageChange === 0;

            return (
              <tr key={item.name} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30">
                <td className="py-3 pl-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: item.color }}
                    >
                      <DynamicIcon name={item.icon} size={12} />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-zinc-100">
                      {item.name}
                    </span>
                  </div>
                </td>

                <td className="py-3 text-right font-bold text-slate-900 dark:text-zinc-100">
                  {formatCurrency(item.currentAmount, currency)}
                </td>

                <td className="py-3 text-right text-slate-500 dark:text-zinc-400">
                  {formatCurrency(item.previousAmount, currency)}
                </td>

                <td className="py-3 pr-2 text-right">
                  {!hasChange ? (
                    <span className="text-slate-400">—</span>
                  ) : isNeutral ? (
                    <span className="inline-flex items-center gap-0.5 text-slate-400 font-semibold">
                      <Minus className="w-3 h-3" /> 0%
                    </span>
                  ) : isIncrease ? (
                    <span className="inline-flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-semibold">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +{item.percentageChange}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ArrowDownRight className="w-3.5 h-3.5" /> {item.percentageChange}%
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
