import { getSalaryCycleById } from '@/actions/salary-actions';
import { getCurrentUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/currency';
import { formatCycleDateRange } from '@/lib/salary-cycle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Calendar, TrendingUp, Receipt, Layers, Wallet } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SalaryCycleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cycle, user] = await Promise.all([
    getSalaryCycleById(id),
    getCurrentUser(),
  ]);

  if (!cycle) {
    notFound();
  }

  const currency = user?.currency || 'Rs.';
  const rangeStr = formatCycleDateRange(cycle.startDate, cycle.endDate);

  const totalSpent = (cycle.expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
  const normalSpent = (cycle.expenses || [])
    .filter((e: any) => !e.isInvestment)
    .reduce((s: number, e: any) => s + e.amount, 0);
  const investments = (cycle.expenses || [])
    .filter((e: any) => e.isInvestment)
    .reduce((s: number, e: any) => s + e.amount, 0);

  const saved = cycle.totalIncome - totalSpent;
  const savingsRate =
    cycle.totalIncome > 0 ? Math.max(0, Math.round((saved / cycle.totalIncome) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/salary-months"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Salary Cycles</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {cycle.name}
            </h1>
            <Badge variant={cycle.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {cycle.status}
            </Badge>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 mt-1">
            {rangeStr}
          </p>
        </div>
      </div>

      {/* Financial Overview Cards for this cycle */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Income
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(cycle.totalIncome, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Base: {formatCurrency(cycle.baseSalary, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Outflow
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
              {formatCurrency(totalSpent, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Normal: {formatCurrency(normalSpent, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Investments &amp; SIP
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {formatCurrency(investments, currency)}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Retained in assets
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Savings
            </div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 mt-1">
              {formatCurrency(saved, currency)}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {savingsRate}% savings rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Breakdown */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Cycle Expenses ({cycle.expenses?.length || 0})</span>
          </CardTitle>
          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
            Total: {formatCurrency(totalSpent, currency)}
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
            {cycle.expenses?.map((exp: any) => {
              const expDateStr = format(parseISO(exp.date), 'MMM d, yyyy');
              return (
                <div
                  key={exp.id}
                  className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: exp.category?.color || '#10b981' }}
                    >
                      <DynamicIcon name={exp.category?.icon} size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100">
                        <span>{exp.description}</span>
                        {exp.isInvestment && (
                          <Badge variant="investment" className="text-[9px] px-1 py-0">
                            SIP
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {exp.category?.name || 'Category'} &bull; {expDateStr}
                        {exp.paymentMethod && ` &bull; ${exp.paymentMethod.name}`}
                      </div>
                    </div>
                  </div>

                  <span className="font-extrabold text-slate-900 dark:text-zinc-100">
                    {formatCurrency(exp.amount, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
