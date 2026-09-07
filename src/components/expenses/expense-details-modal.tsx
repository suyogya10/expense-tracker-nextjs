'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO } from 'date-fns';
import { Edit2, Copy, Trash2, Calendar, CreditCard, Layers } from 'lucide-react';

interface ExpenseDetailsModalProps {
  expense: any | null;
  isOpen: boolean;
  onClose: () => void;
  currency?: string;
  onEdit: (expense: any) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ExpenseDetailsModal({
  expense,
  isOpen,
  onClose,
  currency = 'Rs.',
  onEdit,
  onDuplicate,
  onDelete,
}: ExpenseDetailsModalProps) {
  if (!expense) return null;

  const formattedDate = format(parseISO(expense.date), 'EEEE, MMMM d, yyyy');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-6 rounded-3xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: expense.category?.color || '#10b981' }}
            >
              <DynamicIcon name={expense.category?.icon} size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold truncate">
                {expense.description}
              </DialogTitle>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {expense.category?.name || 'Category'}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Big Amount */}
        <div className="py-3 text-center bg-slate-50 dark:bg-black border border-transparent dark:border-zinc-800 rounded-2xl">
          <div className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50">
            {formatCurrency(expense.amount, currency)}
          </div>
          {expense.isInvestment && (
            <Badge variant="investment" className="mt-1 text-xs">
              Investment / SIP
            </Badge>
          )}
        </div>

        {/* Details list */}
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" /> Date
            </span>
            <span className="font-semibold">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Layers className="w-3.5 h-3.5" /> Salary Cycle
            </span>
            <span className="font-semibold">{expense.salaryMonth?.name || 'Current'}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 text-slate-400">
              <CreditCard className="w-3.5 h-3.5" /> Payment Method
            </span>
            <span className="font-semibold">{expense.paymentMethod?.name || 'Unspecified'}</span>
          </div>

          {expense.notes && (
            <div className="pt-1">
              <span className="text-slate-400 block mb-1">Notes:</span>
              <p className="p-2.5 rounded-xl bg-slate-100 dark:bg-black border border-transparent dark:border-zinc-800 text-slate-800 dark:text-zinc-200">
                {expense.notes}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <DialogFooter className="grid grid-cols-3 gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(expense);
            }}
            className="rounded-xl text-xs gap-1"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onDuplicate(expense.id);
            }}
            className="rounded-xl text-xs gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onClose();
              onDelete(expense.id);
            }}
            className="rounded-xl text-xs gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
