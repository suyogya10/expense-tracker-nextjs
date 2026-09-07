'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency } from '@/lib/currency';
import { toggleRecurringExpense, deleteRecurringExpense } from '@/actions/recurring-actions';
import { AddRecurringModal } from './add-recurring-modal';
import { EditRecurringModal } from './edit-recurring-modal';
import { UpcomingCommitments } from '@/components/dashboard/upcoming-commitments';
import { toast } from 'sonner';
import { Plus, Trash2, Power, Layers, Pencil, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface RecurringListViewProps {
  recurringExpenses: any[];
  activeCycle: any | null;
  categories: any[];
  paymentMethods: any[];
  currency?: string;
}

export function RecurringListView({
  recurringExpenses,
  activeCycle,
  categories,
  paymentMethods,
  currency = 'Rs.',
}: RecurringListViewProps) {
  const router = useRouter();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [deletingRule, setDeletingRule] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const totalMonthlyCommitment = recurringExpenses
    .filter((r) => r.isEnabled)
    .reduce((sum, r) => sum + r.amount, 0);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setTogglingId(id);
    try {
      await toggleRecurringExpense(id, !currentStatus);
      toast.success(currentStatus ? 'Paused recurring rule' : 'Resumed recurring rule');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingRule) return;
    setIsDeleting(true);
    try {
      await deleteRecurringExpense(deletingRule.id);
      toast.success(`Removed recurring rule "${deletingRule.name}"`);
      router.refresh();
      setDeletingRule(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete recurring rule');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Recurring Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Automate monthly subscriptions, utility bills, and SIP investments for each salary cycle.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="font-semibold gap-1.5 rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Recurring Rule</span>
        </Button>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Monthly Commitment
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-zinc-100 mt-1">
              {formatCurrency(totalMonthlyCommitment, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {recurringExpenses.filter((r) => r.isEnabled).length} active monthly rules
            </div>
          </CardContent>
        </Card>

        {activeCycle && (
          <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs sm:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Cycle Status
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-zinc-50 mt-0.5">
                  {activeCycle.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  Recurring expenses are matched automatically to this salary cycle.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming for this cycle */}
      {activeCycle && (
        <UpcomingCommitments
          instances={activeCycle.recurringInstances || []}
          currency={currency}
        />
      )}

      {/* Rules List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Configured Recurring Rules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recurringExpenses.map((rule) => {
            const isProcessing = togglingId === rule.id;

            return (
              <Card
                key={rule.id}
                className={`border transition-colors shadow-2xs ${
                  rule.isEnabled
                    ? 'border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-black'
                    : 'border-slate-200/40 dark:border-zinc-900 bg-slate-50/50 dark:bg-black/40 opacity-75'
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs"
                      style={{ backgroundColor: rule.category?.color || '#6366f1' }}
                    >
                      <DynamicIcon name={rule.category?.icon} size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {rule.name}
                        </span>
                        {rule.isInvestment && (
                          <Badge variant="investment" className="text-[9px] px-1.5 py-0">
                            SIP
                          </Badge>
                        )}
                        {!rule.isEnabled && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            Paused
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                        <div>
                          {rule.category?.name || 'Category'} &bull; Day {rule.dayOfMonth || 1} of month
                        </div>
                        {rule.paymentMethod && (
                          <div>Payment: {rule.paymentMethod.name}</div>
                        )}
                        {rule.notes && (
                          <div className="italic text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                            "{rule.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <div className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                      {formatCurrency(rule.amount, currency)}
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingRule(rule)}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 tap-spring cursor-pointer"
                        title="Edit rule"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isProcessing}
                        onClick={() => handleToggle(rule.id, rule.isEnabled)}
                        className={`h-8 w-8 rounded-lg tap-spring cursor-pointer ${
                          rule.isEnabled
                            ? 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={rule.isEnabled ? 'Pause recurring rule' : 'Resume recurring rule'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingRule(rule)}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 tap-spring cursor-pointer"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add Modal */}
      <AddRecurringModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        categories={categories}
        paymentMethods={paymentMethods}
      />

      {/* Edit Modal */}
      <EditRecurringModal
        isOpen={!!editingRule}
        onClose={() => setEditingRule(null)}
        recurringExpense={editingRule}
        categories={categories}
        paymentMethods={paymentMethods}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRule} onOpenChange={(open) => !open && setDeletingRule(null)}>
        <DialogContent className="max-w-sm p-5 rounded-3xl">
          <DialogHeader className="text-left space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Delete Recurring Rule?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{deletingRule?.name}"</strong>? This will permanently remove this recurring rule and any pending instances for active cycles.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setDeletingRule(null)}
              className="flex-1 rounded-xl h-10 text-xs tap-spring cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex-1 rounded-xl h-10 text-xs tap-spring cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Delete Rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
