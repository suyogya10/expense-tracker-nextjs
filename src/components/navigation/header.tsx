'use client';

import React from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Plus, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import { CurrentUserInfo } from '../layout-shell';

interface HeaderProps {
  onOpenQuickAdd: () => void;
  activeCycle?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  currentUser?: CurrentUserInfo | null;
}

export function Header({ onOpenQuickAdd, activeCycle, currentUser }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 md:px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-black/90">
      {/* Left: Cycle indicator or title */}
      <div className="flex items-center gap-3">
        {activeCycle ? (
          <Link
            href="/salary-months"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:opacity-90 transition-opacity tap-spring"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Active Cycle:</span>
            <span>{activeCycle.name}</span>
          </Link>
        ) : (
          <Link
            href="/salary-months/new"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300 tap-spring"
          >
            <span>+ Create Salary Cycle</span>
          </Link>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onOpenQuickAdd}
          size="sm"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold shadow-2xs tap-spring cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Expense</span>
        </Button>

        <ThemeToggle />
      </div>
    </header>
  );
}
