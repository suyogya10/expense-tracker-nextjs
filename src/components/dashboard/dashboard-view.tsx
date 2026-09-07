'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CycleProgressCard } from './cycle-progress-card';
import { FinancialOverviewCards } from './financial-overview-cards';
import { QuickActionsBar } from './quick-actions-bar';
import { UpcomingCommitments } from './upcoming-commitments';
import { SmartInsightsWidget } from './smart-insights-widget';
import { RecentExpensesWidget } from './recent-expenses-widget';
import { AddIncomeModal } from './add-income-modal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarPlus, AlertCircle } from 'lucide-react';
import { SmartInsight } from '@/lib/insights';

interface DashboardViewProps {
  cycle: any | null;
  metrics: {
    totalDays: number;
    daysElapsed: number;
    daysRemaining: number;
    percentElapsed: number;
  };
  balances: {
    totalIncome: number;
    normalSpending: number;
    investments: number;
    totalOutflow: number;
    currentBalance: number;
    upcomingCommitments: number;
    availableBalance: number;
    percentSpent: number;
    averageDailySpending: number;
    remainingDailyBudget: number;
  };
  insights: SmartInsight[];
  currency?: string;
  onOpenQuickAdd?: () => void;
}

export function DashboardView({
  cycle,
  metrics,
  balances,
  insights,
  currency = 'Rs.',
}: DashboardViewProps) {
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);

  // If no salary cycle is active
  if (!cycle) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <Card className="p-8 border-dashed border-2 border-slate-300 dark:border-zinc-800">
          <CardContent className="p-0 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50">
                No Active Salary Month
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                Your tracker organizes finances around your salary dates rather than calendar months. Create your current cycle to start tracking!
              </p>
            </div>
            <Link href="/salary-months/new" className="inline-block pt-2">
              <Button className="font-semibold gap-2 rounded-xl">
                <CalendarPlus className="w-4 h-4" />
                <span>Create Current Salary Month</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Quick Actions Bar */}
      <QuickActionsBar
        onAddExpense={() => {
          // Trigger floating button or custom event
          const addBtn = document.querySelector('button[aria-label="Add Expense"]') as HTMLButtonElement;
          if (addBtn) addBtn.click();
        }}
        onAddIncome={() => setIsAddIncomeOpen(true)}
      />

      {/* 2. Cycle Progress Card (Time elapsed vs spending pace) */}
      <CycleProgressCard
        cycleName={cycle.name}
        startDate={cycle.startDate}
        endDate={cycle.endDate}
        totalDays={metrics.totalDays}
        daysElapsed={metrics.daysElapsed}
        daysRemaining={metrics.daysRemaining}
        percentElapsed={metrics.percentElapsed}
        percentSpent={balances.percentSpent}
      />

      {/* 3. Financial Overview Cards (Available balance hero, Income, Outflow, Daily budgets) */}
      <FinancialOverviewCards
        totalIncome={balances.totalIncome}
        normalSpending={balances.normalSpending}
        investments={balances.investments}
        totalOutflow={balances.totalOutflow}
        currentBalance={balances.currentBalance}
        upcomingCommitments={balances.upcomingCommitments}
        availableBalance={balances.availableBalance}
        averageDailySpending={balances.averageDailySpending}
        remainingDailyBudget={balances.remainingDailyBudget}
        percentSpent={balances.percentSpent}
        daysRemaining={metrics.daysRemaining}
        currency={currency}
      />

      {/* 4. Smart Insights */}
      {insights.length > 0 && <SmartInsightsWidget insights={insights} />}

      {/* 5. Two-column grid for Upcoming Commitments and Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingCommitments
          instances={cycle.recurringInstances || []}
          currency={currency}
        />
        <RecentExpensesWidget
          expenses={cycle.expenses || []}
          currency={currency}
          onOpenAddExpense={() => {
            const addBtn = document.querySelector('button[aria-label="Add Expense"]') as HTMLButtonElement;
            if (addBtn) addBtn.click();
          }}
        />
      </div>

      {/* Add Income Modal */}
      <AddIncomeModal
        isOpen={isAddIncomeOpen}
        onClose={() => setIsAddIncomeOpen(false)}
        salaryMonthId={cycle.id}
      />
    </div>
  );
}
