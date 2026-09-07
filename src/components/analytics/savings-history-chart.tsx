'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SavingsHistoryChartProps {
  data: Array<{
    cycleName: string;
    saved: number;
    income: number;
    expenses: number;
  }>;
  currency?: string;
}

export function SavingsHistoryChart({ data, currency = 'Rs.' }: SavingsHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        Need at least one salary cycle to display savings history.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-md text-xs space-y-1">
          <div className="font-bold text-slate-900 dark:text-zinc-100">{label}</div>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Saved: {formatCurrency(item.saved, currency)}
          </div>
          <div className="text-slate-500 dark:text-zinc-400">
            Income: {formatCurrency(item.income, currency)} &bull; Spent:{' '}
            {formatCurrency(item.expenses, currency)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
          <XAxis
            dataKey="cycleName"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#888888' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val / 1000}k`}
            tick={{ fontSize: 11, fill: '#888888' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="saved" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.saved >= 0 ? '#10b981' : '#f43f5e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
