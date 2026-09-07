'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateRecurringExpense } from '@/actions/recurring-actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Edit3, TrendingUp } from 'lucide-react';

interface EditRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringExpense: {
    id: string;
    name: string;
    amount: number;
    categoryId: string;
    paymentMethodId?: string | null;
    frequency?: string;
    dayOfMonth?: number | null;
    startDate?: string;
    isInvestment?: boolean;
    isEnabled?: boolean;
    notes?: string | null;
  } | null;
  categories: Array<{ id: string; name: string; isInvestment: boolean }>;
  paymentMethods: Array<{ id: string; name: string }>;
}

export function EditRecurringModal({
  isOpen,
  onClose,
  recurringExpense,
  categories,
  paymentMethods,
}: EditRecurringModalProps) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('10');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isInvestment, setIsInvestment] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recurringExpense) {
      setName(recurringExpense.name || '');
      setAmount(String(recurringExpense.amount || ''));
      setCategoryId(recurringExpense.categoryId || categories[0]?.id || '');
      setPaymentMethodId(recurringExpense.paymentMethodId || '');
      setDayOfMonth(String(recurringExpense.dayOfMonth || 10));
      if (recurringExpense.startDate) {
        try {
          setStartDate(format(parseISO(recurringExpense.startDate), 'yyyy-MM-dd'));
        } catch {
          setStartDate(format(new Date(), 'yyyy-MM-dd'));
        }
      }
      setIsInvestment(Boolean(recurringExpense.isInvestment));
      setNotes(recurringExpense.notes || '');
    }
  }, [recurringExpense, categories]);

  if (!recurringExpense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const day = parseInt(dayOfMonth, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error('Day of month must be between 1 and 31');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateRecurringExpense(recurringExpense.id, {
        name: name.trim(),
        amount: parsedAmount,
        categoryId,
        paymentMethodId: paymentMethodId || null,
        frequency: 'MONTHLY',
        dayOfMonth: day,
        startDate,
        isInvestment,
        isEnabled: recurringExpense.isEnabled ?? true,
        notes: notes.trim() || null,
      });

      toast.success(`Updated recurring rule "${name}"`);
      router.refresh();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update recurring rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit Recurring Bill</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Rule Name
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Internet Fiber, SIP Mutual Fund, Netflix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Amount (Rs.)
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-bold text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Day of Month (1 - 31)
              </label>
              <Input
                type="number"
                min={1}
                max={31}
                required
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const cat = categories.find((c) => c.id === e.target.value);
                  if (cat) setIsInvestment(cat.isInvestment);
                }}
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
                <option value="">None / Unspecified</option>
                {paymentMethods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Account number, billing cycle note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 font-semibold rounded-xl tap-spring"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 font-semibold rounded-xl tap-spring shadow-sm shadow-indigo-500/20"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
