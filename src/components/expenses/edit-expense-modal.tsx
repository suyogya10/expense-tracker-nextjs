'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateExpense } from '@/actions/expense-actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditExpenseModalProps {
  expense: any | null;
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string; isInvestment: boolean }>;
  paymentMethods: Array<{ id: string; name: string }>;
  onUpdated?: () => void;
}

export function EditExpenseModal({
  expense,
  isOpen,
  onClose,
  categories,
  paymentMethods,
  onUpdated,
}: EditExpenseModalProps) {
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isInvestment, setIsInvestment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Warning state for cross-cycle date relocation
  const [cycleWarning, setCycleWarning] = useState<{ from: string; to: string } | null>(null);

  useEffect(() => {
    if (expense) {
      setAmount(String(expense.amount));
      setDescription(expense.description);
      setCategoryId(expense.categoryId);
      setPaymentMethodId(expense.paymentMethodId || '');
      setDate(format(parseISO(expense.date), 'yyyy-MM-dd'));
      setNotes(expense.notes || '');
      setIsInvestment(Boolean(expense.isInvestment));
      setCycleWarning(null);
    }
  }, [expense]);

  if (!expense) return null;

  const handleSave = async (confirmedCycleMove = false) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateExpense(expense.id, {
        amount: parsedAmount,
        description: description.trim(),
        categoryId,
        paymentMethodId: paymentMethodId || null,
        date,
        notes: notes.trim() || null,
        isInvestment,
      });

      if (res.cycleChangedInfo && !confirmedCycleMove) {
        // Prompt user about cycle change
        setCycleWarning({
          from: res.cycleChangedInfo.fromName,
          to: res.cycleChangedInfo.toName,
        });
        return;
      }

      toast.success('Expense updated successfully');
      router.refresh();
      onUpdated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold">Edit Expense</DialogTitle>
          <DialogDescription className="text-xs">
            Modify transaction details or move to another date.
          </DialogDescription>
        </DialogHeader>

        {cycleWarning ? (
          /* Requirement 28: Warning when date change moves across salary cycles */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Salary Cycle Boundary Notice</span>
              </div>
              <p>
                Changing the date will move this expense from:
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 font-semibold space-y-1">
                <div className="text-rose-600 dark:text-rose-400">From: {cycleWarning.from}</div>
                <div className="text-emerald-600 dark:text-emerald-400">To: {cycleWarning.to}</div>
              </div>
              <p>
                Accounting calculations for both salary cycles will be updated. Do you wish to continue?
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setCycleWarning(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting ? 'Moving...' : 'Yes, Move Expense'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4 pt-1"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Amount (Rs.)
              </label>
              <Input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-xl font-bold h-12"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Description
              </label>
              <Input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  Payment Method
                </label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-black dark:text-slate-50"
                >
                  <option value="">None</option>
                  {paymentMethods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Date (Changing across cycle will warn)
              </label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40">
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Treat as Investment / SIP
              </span>
              <input
                type="checkbox"
                checked={isInvestment}
                onChange={(e) => setIsInvestment(e.target.checked)}
                className="w-5 h-5 accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Notes
              </label>
              <Input
                type="text"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
