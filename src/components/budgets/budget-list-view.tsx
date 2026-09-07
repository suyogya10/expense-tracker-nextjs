'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency } from '@/lib/currency';
import { deleteBudget } from '@/actions/budget-actions';
import { UpsertBudgetModal } from './upsert-budget-modal';
import { toast } from 'sonner';
import { Target, Plus, Trash2, Edit2, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  remainingAmount: number;
  alertLevel: 'safe' | 'warning' | 'danger' | 'exceeded';
}

interface BudgetListViewProps {
  budgets: BudgetItem[];
  activeCycle: any | null;
  categories: any[];
  currency?: string;
}

export function BudgetListView({
  budgets,
  activeCycle,
  categories,
  currency = 'Rs.',
}: BudgetListViewProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{ categoryId: string; amount: number } | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove budget for ${name}?`)) return;
    try {
      await deleteBudget(id);
      toast.success(`Removed budget for ${name}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove budget');
    }
  };

  if (!activeCycle) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Please create an active salary cycle first to manage budgets.
        </p>
      </div>
    );
  }

  const totalBudgeted = budgets.reduce((s, b) => s + b.budgetAmount, 0);
  const totalSpentInBudgets = budgets.reduce((s, b) => s + b.spentAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Category Budgets
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Track spending limits for {activeCycle.name} (Optional)
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="font-semibold gap-1.5 rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Budgeted
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 mt-1">
              {formatCurrency(totalBudgeted, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Across {budgets.length} configured categories
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Spent Under Budgets
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-50 mt-1">
              {formatCurrency(totalSpentInBudgets, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {totalBudgeted > 0
                ? `${Math.round((totalSpentInBudgets / totalBudgeted) * 100)}% of total allocated budget used`
                : 'No budgets defined'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {budgets.length === 0 && (
        <Card className="border-dashed border-2 border-slate-300 dark:border-zinc-800 p-8 text-center">
          <CardContent className="p-0 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                No budgets set for this cycle
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                Budgets are optional. You can set limits for categories like Food, Shopping, or Entertainment to receive threshold warnings at 75%, 90%, and 100%.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingBudget(null);
                setIsModalOpen(true);
              }}
              className="rounded-xl text-xs font-semibold"
            >
              + Set Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          let progressColor = 'bg-emerald-600 dark:bg-emerald-500';
          let alertBanner = null;

          if (b.alertLevel === 'exceeded') {
            progressColor = 'bg-rose-600 dark:bg-rose-500';
            alertBanner = (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-bold">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Budget exceeded by {formatCurrency(Math.abs(b.remainingAmount), currency)}!</span>
              </div>
            );
          } else if (b.alertLevel === 'danger') {
            progressColor = 'bg-amber-600 dark:bg-amber-500';
            alertBanner = (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>90% budget used &bull; {formatCurrency(b.remainingAmount, currency)} remaining</span>
              </div>
            );
          } else if (b.alertLevel === 'warning') {
            progressColor = 'bg-amber-500 dark:bg-amber-400';
            alertBanner = (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>75% budget used &bull; {formatCurrency(b.remainingAmount, currency)} remaining</span>
              </div>
            );
          } else {
            alertBanner = (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>On track &bull; {formatCurrency(b.remainingAmount, currency)} remaining</span>
              </div>
            );
          }

          return (
            <Card key={b.id} className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
              <CardContent className="p-5 space-y-3.5">
                {/* Top: Category Icon, Name, and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: b.categoryColor || '#10b981' }}
                    >
                      <DynamicIcon name={b.categoryIcon} size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-zinc-50">
                        {b.categoryName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        Budget: {formatCurrency(b.budgetAmount, currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-lg"
                      onClick={() => {
                        setEditingBudget({ categoryId: b.categoryId, amount: b.budgetAmount });
                        setIsModalOpen(true);
                      }}
                      title="Edit budget"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 rounded-lg"
                      onClick={() => handleDelete(b.id, b.categoryName)}
                      title="Delete budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Amount Progress Comparison */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-zinc-300">
                      {formatCurrency(b.spentAmount, currency)} / {formatCurrency(b.budgetAmount, currency)}
                    </span>
                    <span className={b.percentage >= 100 ? 'text-rose-600 font-bold' : 'text-slate-900 dark:text-zinc-100'}>
                      {b.percentage}%
                    </span>
                  </div>

                  <Progress
                    value={Math.min(100, b.percentage)}
                    className="h-2.5 rounded-full bg-slate-100 dark:bg-zinc-800"
                    indicatorClassName={progressColor}
                  />
                </div>

                {/* Alert Notification banner */}
                <div className="pt-1">{alertBanner}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upsert Modal */}
      <UpsertBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        salaryMonthId={activeCycle.id}
        categories={categories}
        existingBudget={editingBudget}
      />
    </div>
  );
}
