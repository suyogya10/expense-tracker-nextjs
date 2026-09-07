'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency } from '@/lib/currency';
import { calculateSalaryCycleEnd, formatCycleDateRange } from '@/lib/salary-cycle';
import { filterApplicableRecurringExpenses } from '@/lib/recurring';
import { createSalaryCycle } from '@/actions/salary-actions';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Calendar, Repeat, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreateCycleFormProps {
  defaultSalary: number;
  recurringRules: any[];
  currency?: string;
}

export function CreateCycleForm({
  defaultSalary,
  recurringRules,
  currency = 'Rs.',
}: CreateCycleFormProps) {
  const router = useRouter();

  const [startDateStr, setStartDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isManualEndDate, setIsManualEndDate] = useState(false);
  const [manualEndDateStr, setManualEndDateStr] = useState('');
  const [baseSalary, setBaseSalary] = useState(String(defaultSalary || 60000));
  const [bonus, setBonus] = useState('0');
  const [otherIncome, setOtherIncome] = useState('0');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected recurring IDs to include
  const [selectedRecurringIds, setSelectedRecurringIds] = useState<Set<string>>(
    new Set(recurringRules.map((r) => r.id))
  );

  // Computed End Date
  const computedEndDate = useMemo(() => {
    try {
      const start = parseISO(startDateStr);
      return calculateSalaryCycleEnd(start);
    } catch {
      return new Date();
    }
  }, [startDateStr]);

  const effectiveEndDate = isManualEndDate && manualEndDateStr
    ? parseISO(manualEndDateStr)
    : computedEndDate;

  const effectiveEndDateStr = format(effectiveEndDate, 'yyyy-MM-dd');

  // Date range formatted
  const formattedRange = formatCycleDateRange(startDateStr, effectiveEndDateStr);

  // Applicable Recurring Expenses Preview
  const applicableRecurring = useMemo(() => {
    try {
      return filterApplicableRecurringExpenses(
        recurringRules.map((r) => ({
          ...r,
          amount: Number(r.amount),
        })),
        startDateStr,
        effectiveEndDateStr
      );
    } catch {
      return [];
    }
  }, [recurringRules, startDateStr, effectiveEndDateStr]);

  const toggleRecurring = (id: string) => {
    const next = new Set(selectedRecurringIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRecurringIds(next);
  };

  // Total committed sum
  const totalCommitted = applicableRecurring
    .filter((r) => selectedRecurringIds.has(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  const totalIncomeValue =
    (parseFloat(baseSalary) || 0) +
    (parseFloat(bonus) || 0) +
    (parseFloat(otherIncome) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedBase = parseFloat(baseSalary);
    if (isNaN(parsedBase) || parsedBase <= 0) {
      toast.error('Please enter a valid base salary');
      return;
    }

    setIsSubmitting(true);
    try {
      const cycle = await createSalaryCycle({
        startDate: startDateStr,
        endDate: isManualEndDate ? manualEndDateStr : effectiveEndDateStr,
        baseSalary: parsedBase,
        bonus: parseFloat(bonus) || 0,
        otherIncome: parseFloat(otherIncome) || 0,
        notes: notes.trim() || undefined,
        status: 'ACTIVE',
        confirmRecurringIds: Array.from(selectedRecurringIds),
      });

      toast.success(`Created Salary Cycle: ${cycle.name}`);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create salary cycle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>New Salary Month</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Anchor your financial month to the day your salary is received.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-5">
          {/* Salary Received Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Salary Received Date
            </label>
            <Input
              type="date"
              required
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="text-base font-medium h-12"
            />
          </div>

          {/* Computed Cycle Range Preview Banner (Requirement 17) */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[10px]">
              Calculated Financial Month
            </div>
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
              {formattedRange}
            </div>
            <div className="text-[11px] text-emerald-600/90 dark:text-emerald-400">
              Automatically calculated as: Start Date + 1 Month - 1 Day
            </div>
          </div>

          {/* Manual override option */}
          <div className="text-xs">
            <button
              type="button"
              onClick={() => {
                if (!isManualEndDate) {
                  setManualEndDateStr(effectiveEndDateStr);
                }
                setIsManualEndDate(!isManualEndDate);
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              {isManualEndDate ? 'Use Automatic End Date' : 'Customize cycle end date manually'}
            </button>

            {isManualEndDate && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Manual End Date
                </label>
                <Input
                  type="date"
                  value={manualEndDateStr}
                  onChange={(e) => setManualEndDateStr(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Income fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Base Salary (Rs.)
              </label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="60000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                className="font-bold text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Bonus (Rs.)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="font-bold text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Other Inflows (Rs.)
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={otherIncome}
                onChange={(e) => setOtherIncome(e.target.value)}
                className="font-bold text-base"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-black border border-transparent dark:border-zinc-800 rounded-xl flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-600 dark:text-zinc-400">Total Cycle Income:</span>
            <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncomeValue, currency)}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
              Notes (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Festival month, appraisal salary adjustment"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Recurring Expenses Preview & Selection (Requirement 17) */}
          {applicableRecurring.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{applicableRecurring.length} Recurring Expenses Found</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Select which recurring expenses to include for this cycle.
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                    Committed: {formatCurrency(totalCommitted, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {applicableRecurring.map((rule) => {
                  const isChecked = selectedRecurringIds.has(rule.id);
                  const expDateStr = format(rule.expectedDate, 'MMM d');

                  return (
                    <div
                      key={rule.id}
                      onClick={() => toggleRecurring(rule.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-colors cursor-pointer text-xs ${
                        isChecked
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // Handled by parent div
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-zinc-100 mr-2">
                            {rule.name}
                          </span>
                          {rule.isInvestment && (
                            <Badge variant="investment" className="text-[9px] px-1 py-0">
                              SIP
                            </Badge>
                          )}
                          <div className="text-[11px] text-slate-500">
                            Expected: {expDateStr}
                          </div>
                        </div>
                      </div>

                      <span className="font-bold text-slate-900 dark:text-zinc-100">
                        {formatCurrency(rule.amount, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold rounded-2xl shadow-md shadow-emerald-600/20"
          >
            {isSubmitting ? 'Creating Salary Month...' : 'Create Salary Month'}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
