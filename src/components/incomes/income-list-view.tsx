'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { deleteIncome } from '@/actions/income-actions';
import { AddIncomeModal } from '@/components/dashboard/add-income-modal';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { TrendingUp, Plus, Trash2, Calendar, Coins } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  date: string;
  description?: string | null;
  salaryMonthId: string;
  salaryMonth?: {
    name: string;
  } | null;
}

interface IncomeListViewProps {
  incomes: IncomeItem[];
  activeCycle: any | null;
  salaryCycles: any[];
  currency?: string;
}

export function IncomeListView({
  incomes,
  activeCycle,
  salaryCycles,
  currency = 'Rs.',
}: IncomeListViewProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState<string>(activeCycle?.id || 'all');

  const filteredIncomes = incomes.filter((i) => {
    if (selectedCycleId !== 'all' && i.salaryMonthId !== selectedCycleId) {
      return false;
    }
    return true;
  });

  const totalIncomeSum = filteredIncomes.reduce((s, i) => s + i.amount, 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await deleteIncome(id);
      toast.success('Income entry removed');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete income');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Income Sources
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Track salary cycles, bonuses, freelance, and other income inflows.
          </p>
        </div>

        {activeCycle && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="font-semibold gap-1.5 rounded-xl shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Income Entry</span>
          </Button>
        )}
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inflows
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalIncomeSum, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {filteredIncomes.length} recorded entries
            </div>
          </CardContent>
        </Card>

        {activeCycle && (
          <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs sm:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Cycle Total
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
                  {activeCycle.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  Base Salary: {formatCurrency(activeCycle.baseSalary, currency)} &bull; Bonus:{' '}
                  {formatCurrency(activeCycle.bonus, currency)}
                </div>
              </div>
              <div className="text-right font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">
                {formatCurrency(activeCycle.totalIncome, currency)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filter by Cycle */}
      <div className="flex items-center justify-between gap-3">
        <select
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Salary Cycles</option>
          {salaryCycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.status === 'ACTIVE' ? '(Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Income List */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {filteredIncomes.map((item) => {
            const dateStr = format(parseISO(item.date), 'MMM d, yyyy');

            return (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-zinc-900/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {item.source}
                      </span>
                      {item.salaryMonth && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {item.salaryMonth.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      {item.description || 'Income payment'} &bull; {dateStr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(item.amount, currency)}
                  </span>
                  {item.source !== 'Salary' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                      onClick={() => handleDelete(item.id)}
                      title="Delete income"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add Income Modal */}
      {activeCycle && (
        <AddIncomeModal
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          salaryMonthId={activeCycle.id}
        />
      )}
    </div>
  );
}
