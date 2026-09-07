'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { confirmRecurringInstance, skipRecurringInstance, deleteRecurringInstance } from '@/actions/recurring-actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Repeat, Check, SkipForward, Clock, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpcomingCommitmentsProps {
  instances: Array<{
    id: string;
    expectedDate: string;
    amount: number;
    status: string;
    recurringExpense: {
      name: string;
      isInvestment: boolean;
    };
  }>;
  currency?: string;
}

export function UpcomingCommitments({ instances, currency = 'Rs.' }: UpcomingCommitmentsProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const pendingInstances = instances.filter((i) => i.status === 'PENDING');

  const handleConfirm = async (id: string, name: string) => {
    setLoadingId(id);
    try {
      await confirmRecurringInstance(id);
      toast.success(`Recorded ${name} as expense`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSkip = async (id: string, name: string) => {
    setLoadingId(id);
    try {
      await skipRecurringInstance(id);
      toast.info(`Skipped ${name} for this cycle`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to skip');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove upcoming commitment for "${name}" from this cycle?`)) return;
    setLoadingId(id);
    try {
      await deleteRecurringInstance(id);
      toast.success(`Removed "${name}" commitment from this cycle`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove commitment');
    } finally {
      setLoadingId(null);
    }
  };

  if (pendingInstances.length === 0) {
    return (
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
            <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Upcoming Commitments</span>
          </CardTitle>
          <Badge variant="secondary" className="text-[11px]">
            All Cleared
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-xs text-slate-500 dark:text-zinc-400">
            No pending recurring bills or commitments for this cycle.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalUpcoming = pendingInstances.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-zinc-100">
            <Repeat className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Upcoming Commitments</span>
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Total committed: <strong>{formatCurrency(totalUpcoming, currency)}</strong>
          </p>
        </div>
        <Badge variant="warning" className="text-xs">
          {pendingInstances.length} Upcoming
        </Badge>
      </CardHeader>

      <CardContent className="space-y-2.5">
        {pendingInstances.map((item) => {
          const dateStr = format(parseISO(item.expectedDate), 'MMM d');
          const isProcessing = loadingId === item.id;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">
                    {item.recurringExpense.name}
                  </span>
                  {item.recurringExpense.isInvestment && (
                    <Badge variant="investment" className="text-[10px] px-1.5 py-0">
                      SIP
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Expected {dateStr}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 mr-1">
                  {formatCurrency(item.amount, currency)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleConfirm(item.id, item.recurringExpense.name)}
                  className="h-8 px-2.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 text-xs font-semibold gap-1 tap-spring cursor-pointer"
                  title="Confirm & record as expense"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pay</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isProcessing}
                  onClick={() => handleSkip(item.id, item.recurringExpense.name)}
                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 tap-spring cursor-pointer"
                  title="Skip this cycle"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isProcessing}
                  onClick={() => handleDelete(item.id, item.recurringExpense.name)}
                  className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 tap-spring cursor-pointer"
                  title="Delete from this cycle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
