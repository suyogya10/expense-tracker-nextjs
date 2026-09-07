'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { upsertBudget } from '@/actions/budget-actions';
import { toast } from 'sonner';
import { Target } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpsertBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  salaryMonthId: string;
  categories: Array<{ id: string; name: string; icon: string; color: string }>;
  existingBudget?: { categoryId: string; amount: number } | null;
}

export function UpsertBudgetModal({
  isOpen,
  onClose,
  salaryMonthId,
  categories,
  existingBudget,
}: UpsertBudgetModalProps) {
  const router = useRouter();

  const [categoryId, setCategoryId] = useState(
    existingBudget?.categoryId || categories[0]?.id || ''
  );
  const [amount, setAmount] = useState(
    existingBudget ? String(existingBudget.amount) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await upsertBudget(salaryMonthId, categoryId, parsedAmount);
      toast.success('Budget saved for this cycle');
      router.refresh();
      onClose();
      setAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-6 rounded-3xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-600" />
            <span>Set Category Budget</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-black dark:text-slate-50"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Cycle Budget Limit (Rs.)
            </label>
            <Input
              type="number"
              step="1"
              required
              placeholder="e.g. 8000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-bold text-xl h-12"
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 font-semibold rounded-xl tap-spring shadow-sm shadow-indigo-500/20"
          >
            {isSubmitting ? 'Saving...' : 'Set Budget'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
