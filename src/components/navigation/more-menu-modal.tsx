'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  Repeat,
  Target,
  CalendarDays,
  Settings,
  PlusCircle,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { logoutAction } from '@/actions/auth-actions';
import { useRouter } from 'next/navigation';
import { CurrentUserInfo } from '../layout-shell';

interface MoreMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: CurrentUserInfo | null;
}

export function MoreMenuModal({ isOpen, onClose, currentUser }: MoreMenuModalProps) {
  const router = useRouter();

  const baseMenuItems = [
    { title: 'Income Sources', href: '/incomes', icon: TrendingUp, desc: 'Manage base salary, bonuses & other inflows' },
    { title: 'Recurring Expenses', href: '/recurring', icon: Repeat, desc: 'Manage subscriptions, SIPs & utilities' },
    { title: 'Category Budgets', href: '/budgets', icon: Target, desc: 'Set and track monthly category budget limits' },
    { title: 'Salary Cycles History', href: '/salary-months', icon: CalendarDays, desc: 'Review past financial months and savings' },
    { title: 'New Salary Cycle', href: '/salary-months/new', icon: PlusCircle, desc: 'Record a new salary arrival and start a cycle' },
    { title: 'Settings & Data Export', href: '/settings', icon: Settings, desc: 'Profile, currency, backup & categories' },
  ];

  const menuItems = [...baseMenuItems];
  if (currentUser?.role === 'ADMIN') {
    menuItems.splice(5, 0, {
      title: 'User Management',
      href: '/users',
      icon: ShieldCheck,
      desc: 'Create, edit, reset passwords & manage user accounts',
    });
  }

  const handleLogout = async () => {
    onClose();
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm rounded-3xl p-5">
        <DialogHeader className="text-left pb-2 border-b border-slate-100 dark:border-zinc-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">More Options</DialogTitle>
          <div className="mr-8">
            <ThemeToggle />
          </div>
        </DialogHeader>

        <div className="grid gap-1.5 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-start gap-3.5 p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-900 tap-spring transition-colors"
              >
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{item.title}</span>
                    {item.title === 'User Management' && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </Link>
            );
          })}

          {currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3.5 p-2.5 rounded-2xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 tap-spring transition-colors w-full text-left cursor-pointer mt-1 pt-2 border-t border-slate-100 dark:border-zinc-800"
            >
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Sign Out</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400 leading-tight mt-0.5">
                  Signed in as @{currentUser.username || 'user'}
                </div>
              </div>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
