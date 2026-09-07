'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  TrendingUp,
  CalendarDays,
  PieChart,
  Target,
  Repeat,
  Settings,
  Plus,
  Coins,
  ShieldCheck,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/actions/auth-actions';
import { useRouter } from 'next/navigation';
import { CurrentUserInfo } from '../layout-shell';

interface SidebarProps {
  onOpenQuickAdd: () => void;
  activeCycleName?: string;
  currentUser?: CurrentUserInfo | null;
}

export function Sidebar({ onOpenQuickAdd, activeCycleName, currentUser }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const baseNavItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Expenses', href: '/expenses', icon: Receipt },
    { name: 'Income', href: '/incomes', icon: TrendingUp },
    { name: 'Recurring', href: '/recurring', icon: Repeat },
    { name: 'Budgets', href: '/budgets', icon: Target },
    { name: 'Analytics', href: '/analytics', icon: PieChart },
    { name: 'Salary Cycles', href: '/salary-months', icon: CalendarDays },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  // If currentUser is ADMIN, insert Users management link
  const navItems = [...baseNavItems];
  if (currentUser?.role === 'ADMIN') {
    navItems.splice(7, 0, {
      name: 'Users',
      href: '/users',
      icon: ShieldCheck,
    });
  }

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-200/80 dark:border-zinc-800 bg-white/75 dark:bg-black/90 backdrop-blur-md h-screen sticky top-0 px-4 py-6 justify-between overflow-y-auto no-scrollbar">
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
                Expense Tracker
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                Salary Cycles
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Add Button */}
        <div className="px-2">
          <Button
            onClick={onOpenQuickAdd}
            className="w-full justify-center gap-2 shadow-sm shadow-indigo-500/20 font-semibold rounded-xl tap-spring"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1 px-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium tap-spring transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-zinc-500')} />
                <span>{item.name}</span>
                {item.name === 'Users' && (
                  <span className="ml-auto text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                    Admin
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Status */}
      <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-zinc-800/80">
        {activeCycleName && (
          <div className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-black border border-slate-200/60 dark:border-zinc-800 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold">
              Active Cycle
            </div>
            <div className="font-semibold text-slate-800 dark:text-zinc-200 truncate mt-0.5">
              {activeCycleName}
            </div>
          </div>
        )}

        {/* Current user badge & Logout */}
        {currentUser && (
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-black border border-slate-200/70 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/20 shrink-0">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs text-foreground truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <span>@{currentUser.username || 'user'}</span>
                  {currentUser.role === 'ADMIN' && (
                    <span className="text-[9px] font-bold px-1 py-0 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer tap-spring shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
