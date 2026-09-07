'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, TrendingUp, CalendarDays, Repeat, PieChart } from 'lucide-react';

interface QuickActionsBarProps {
  onAddExpense: () => void;
  onAddIncome: () => void;
}

export function QuickActionsBar({ onAddExpense, onAddIncome }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {/* 1. + Expense */}
      <button
        onClick={onAddExpense}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs shadow-indigo-500/20 tap-spring transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>+ Expense</span>
      </button>

      {/* 2. + Income */}
      <button
        onClick={onAddIncome}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 font-semibold text-xs whitespace-nowrap tap-spring transition-colors cursor-pointer"
      >
        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>+ Income</span>
      </button>

      {/* 3. + Salary Cycle */}
      <Link
        href="/salary-months/new"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 font-semibold text-xs whitespace-nowrap tap-spring transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <span>+ Salary Cycle</span>
      </Link>

      {/* 4. Recurring */}
      <Link
        href="/recurring"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 font-semibold text-xs whitespace-nowrap tap-spring transition-colors"
      >
        <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span>Recurring</span>
      </Link>

      {/* 5. Analytics */}
      <Link
        href="/analytics"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900 font-semibold text-xs whitespace-nowrap tap-spring transition-colors"
      >
        <PieChart className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <span>Analytics</span>
      </Link>
    </div>
  );
}
