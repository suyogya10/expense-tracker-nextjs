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
import { DynamicIcon } from '@/components/dynamic-icon';
import { createExpense } from '@/actions/expense-actions';
import { parseQuickExpense } from '@/lib/quick-parser';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Zap, Tag, CreditCard, Sparkles, TrendingUp } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string; icon: string; color: string; isInvestment: boolean }>;
  paymentMethods: Array<{ id: string; name: string; icon: string }>;
  defaultDate?: string;
  onExpenseCreated?: (expense: any) => void;
}

export function QuickAddModal({
  isOpen,
  onClose,
  categories,
  paymentMethods,
  defaultDate,
  onExpenseCreated,
}: QuickAddModalProps) {
  const [mode, setMode] = useState<'form' | 'quick'>('form');
  const [quickInput, setQuickInput] = useState('');

  // Form states
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [date, setDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [isInvestment, setIsInvestment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id);
    }
    if (paymentMethods.length > 0 && !paymentMethodId) {
      setPaymentMethodId(paymentMethods[0].id);
    }
  }, [categories, paymentMethods, categoryId, paymentMethodId]);

  // When category changes, auto-set isInvestment if the category is marked as investment
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      setIsInvestment(cat.isInvestment);
    }
  };

  // Quick parser live preview
  const parsedPreview = mode === 'quick' ? parseQuickExpense(quickInput) : null;

  const handleApplyQuick = () => {
    if (!parsedPreview?.amount) {
      toast.error('Please include an amount in your quick entry (e.g. "450 Food")');
      return;
    }

    setAmount(String(parsedPreview.amount));
    setDescription(parsedPreview.description || 'Expense');

    if (parsedPreview.categoryHint) {
      const match = categories.find((c) =>
        c.name.toLowerCase().includes(parsedPreview.categoryHint!.toLowerCase())
      );
      if (match) {
        setCategoryId(match.id);
        setIsInvestment(match.isInvestment);
      }
    }

    if (parsedPreview.paymentMethodHint) {
      const pmMatch = paymentMethods.find((p) =>
        p.name.toLowerCase().includes(parsedPreview.paymentMethodHint!.toLowerCase())
      );
      if (pmMatch) setPaymentMethodId(pmMatch.id);
    }

    if (parsedPreview.isInvestment) {
      setIsInvestment(true);
    }

    setMode('form');
    toast.success('Parsed! Review details and save.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createExpense({
        amount: parsedAmount,
        description: description.trim(),
        categoryId,
        paymentMethodId: paymentMethodId || null,
        date,
        notes: notes.trim() || null,
        isInvestment,
      });

      toast.success(`Recorded Rs. ${parsedAmount.toLocaleString()} for ${description}`);
      onExpenseCreated?.(created);
      onClose();

      // Reset form
      setAmount('');
      setDescription('');
      setNotes('');
      setQuickInput('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            <span>Add Expense</span>
          </DialogTitle>
          <div className="mr-8 flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setMode('form')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'form'
                  ? 'bg-white dark:bg-black border border-transparent dark:border-zinc-800 shadow-xs text-slate-900 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => setMode('quick')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer tap-spring ${
                mode === 'quick'
                  ? 'bg-white dark:bg-black border border-transparent dark:border-zinc-800 shadow-xs text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              Quick
            </button>
          </div>
        </DialogHeader>

        {mode === 'quick' ? (
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-300">
              <div className="flex items-center gap-1.5 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Natural Language Quick Add
              </div>
              Type amounts and keywords like:
              <div className="font-mono text-[11px] mt-1 text-indigo-700 dark:text-indigo-400">
                &bull; 450 Food<br />
                &bull; 180 Coffee Cash<br />
                &bull; Rs. 2450 Groceries<br />
                &bull; SIP 3000
              </div>
            </div>

            <Input
              type="text"
              placeholder="e.g. 450 Lunch Cash"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              className="text-lg py-3 h-12"
              autoFocus
            />

            {parsedPreview?.amount && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-black border border-transparent dark:border-zinc-800 text-xs space-y-1">
                <div className="text-slate-500 dark:text-slate-400">Parsed Preview:</div>
                <div className="font-bold text-base text-indigo-600 dark:text-indigo-400">
                  Rs. {parsedPreview.amount.toLocaleString()}
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  Desc: <span className="font-medium">{parsedPreview.description}</span>
                </div>
                {parsedPreview.categoryHint && (
                  <div className="text-slate-700 dark:text-slate-300">
                    Category: <span className="font-medium">{parsedPreview.categoryHint}</span>
                  </div>
                )}
                {parsedPreview.paymentMethodHint && (
                  <div className="text-slate-700 dark:text-slate-300">
                    Payment: <span className="font-medium">{parsedPreview.paymentMethodHint}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleApplyQuick}
              className="w-full font-semibold rounded-xl tap-spring"
              disabled={!quickInput.trim()}
            >
              Parse &amp; Continue
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Amount input - Large and prominent */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Amount (Rs.)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                  Rs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex h-13 w-full rounded-2xl border border-slate-200 bg-white pl-13 pr-4 text-2xl font-bold tracking-tight shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-black dark:text-slate-50"
                  autoFocus
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Description
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Lunch with team, Groceries"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Category Grid (Visual selection with internal padding to prevent highlight clipping) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-500" />
                Category
              </label>
              <div className="p-1 -m-1 max-h-40 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {categories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-medium tap-spring transition-all cursor-pointer border outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600 ring-inset dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200 dark:ring-indigo-400 shadow-xs'
                            : 'border-slate-200 dark:border-zinc-800/90 bg-slate-50/70 dark:bg-black text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 text-white shadow-2xs shrink-0"
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon} size={14} />
                        </div>
                        <span className="truncate w-full text-center text-[11px] leading-tight font-medium">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Date & Payment Method */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Payment
                </label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-800 dark:bg-black dark:text-slate-50"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Investment Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/40">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                    Count as Investment / SIP
                  </div>
                  <div className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                    Included in effective savings rather than consumed spending
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isInvestment}
                onChange={(e) => setIsInvestment(e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded-md cursor-pointer"
              />
            </div>

            {/* Optional Notes */}
            <div>
              <Input
                type="text"
                placeholder="Optional notes or details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold rounded-2xl shadow-md shadow-indigo-600/20 tap-spring"
            >
              {isSubmitting ? 'Saving Expense...' : 'Record Expense'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
