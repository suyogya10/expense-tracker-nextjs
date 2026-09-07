'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface SpendingTrendChartProps {
  data: Array<{
    day: string;
    actualSpent: number;
    budgetGuideline: number;
  }>;
  currency?: string;
}

export function SpendingTrendChart({ data, currency = 'Rs.' }: SpendingTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No spending timeline data available yet.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-md text-xs space-y-1">
          <div className="font-bold text-slate-900 dark:text-zinc-100">{label}</div>
          <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
            Spent: {formatCurrency(payload[0]?.value, currency)}
          </div>
          {payload[1] && (
            <div className="text-slate-400 font-medium">
              Pace Target: {formatCurrency(payload[1]?.value, currency)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
          <XAxis
            dataKey="day"
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
          <Area
            type="monotone"
            dataKey="actualSpent"
            stroke="#6366f1"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#spendGrad)"
            name="Actual Spending"
          />
          <Line
            type="monotone"
            dataKey="budgetGuideline"
            stroke="#94a3b8"
            strokeDasharray="4 4"
            dot={false}
            strokeWidth={1.5}
            name="Budget Pace"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
