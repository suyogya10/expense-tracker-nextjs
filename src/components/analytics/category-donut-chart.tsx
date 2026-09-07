'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface CategoryDonutChartProps {
  data: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
  currency?: string;
}

export function CategoryDonutChart({ data, currency = 'Rs.' }: CategoryDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No spending data to visualize.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0;
      return (
        <div className="p-2.5 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 shadow-md text-xs">
          <div className="font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <div className="text-slate-600 dark:text-zinc-300 mt-1">
            {formatCurrency(item.amount, currency)} ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
