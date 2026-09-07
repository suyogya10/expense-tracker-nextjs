'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Plus,
  PieChart,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
  onOpenMoreMenu: () => void;
}

export function BottomNav({ onOpenQuickAdd, onOpenMoreMenu }: BottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isExpenses = pathname.startsWith('/expenses');
  const isAnalytics = pathname.startsWith('/analytics');
  const isMore =
    pathname.startsWith('/budgets') ||
    pathname.startsWith('/recurring') ||
    pathname.startsWith('/salary-months') ||
    pathname.startsWith('/incomes') ||
    pathname.startsWith('/settings');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-black/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] px-3 py-1.5 shadow-xl">
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {/* 1. Home */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-3 rounded-xl tap-target-44 tap-spring transition-colors relative',
            isHome
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <LayoutDashboard className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[10px] mt-1">Home</span>
          {isHome && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
        </Link>

        {/* 2. Expenses */}
        <Link
          href="/expenses"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-3 rounded-xl tap-target-44 tap-spring transition-colors relative',
            isExpenses
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <Receipt className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[10px] mt-1">Expenses</span>
          {isExpenses && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
        </Link>

        {/* 3. Center Add Button (Prominent) */}
        <div className="flex items-center justify-center -mt-5">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer border-4 border-slate-50 dark:border-slate-950"
            aria-label="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Analytics */}
        <Link
          href="/analytics"
          className={cn(
            'flex flex-col items-center justify-center py-1 px-3 rounded-xl tap-target-44 tap-spring transition-colors relative',
            isAnalytics
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <PieChart className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[10px] mt-1">Stats</span>
          {isAnalytics && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
        </Link>

        {/* 5. More Menu */}
        <button
          onClick={onOpenMoreMenu}
          className={cn(
            'flex flex-col items-center justify-center py-1 px-3 rounded-xl tap-target-44 tap-spring transition-colors cursor-pointer relative',
            isMore
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <Menu className="w-5 h-5 transition-transform duration-200" />
          <span className="text-[10px] mt-1">More</span>
          {isMore && <span className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
        </button>
      </div>
    </nav>
  );
}
