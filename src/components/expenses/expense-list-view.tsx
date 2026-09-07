'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatCurrency } from '@/lib/currency';
import { deleteExpense, duplicateExpense } from '@/actions/expense-actions';
import { EditExpenseModal } from './edit-expense-modal';
import { ExpenseDetailsModal } from './expense-details-modal';
import { toast } from 'sonner';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreVertical,
  Edit2,
  Copy,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExpenseItem {
  id: string;
  amount: number;
  date: string;
  description: string;
  notes?: string | null;
  isInvestment: boolean;
  categoryId: string;
  paymentMethodId?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
    isInvestment: boolean;
  } | null;
  paymentMethod?: {
    id: string;
    name: string;
  } | null;
  salaryMonth?: {
    id: string;
    name: string;
  } | null;
}

interface ExpenseListViewProps {
  initialExpenses: ExpenseItem[];
  categories: any[];
  paymentMethods: any[];
  salaryCycles: any[];
  activeCycleId?: string;
  currency?: string;
}

export function ExpenseListView({
  initialExpenses,
  categories,
  paymentMethods,
  salaryCycles,
  activeCycleId,
  currency = 'Rs.',
}: ExpenseListViewProps) {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState<string>(activeCycleId || 'all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  // Modals
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  // Filter & Sort
  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((e) => {
      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const descMatch = e.description.toLowerCase().includes(query);
        const catMatch = e.category?.name.toLowerCase().includes(query);
        const notesMatch = e.notes?.toLowerCase().includes(query);
        if (!descMatch && !catMatch && !notesMatch) return false;
      }

      // Salary cycle
      if (selectedCycleId !== 'all' && e.salaryMonth?.id !== selectedCycleId) {
        return false;
      }

      // Category
      if (selectedCategoryId !== 'all' && e.categoryId !== selectedCategoryId) {
        return false;
      }

      // Payment method
      if (selectedPaymentMethodId !== 'all' && e.paymentMethodId !== selectedPaymentMethodId) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount-desc') return b.amount - a.amount;
      if (sortBy === 'amount-asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    initialExpenses,
    search,
    selectedCycleId,
    selectedCategoryId,
    selectedPaymentMethodId,
    sortBy,
  ]);

  // Group by Date for Mobile List
  const groupedExpenses = useMemo(() => {
    const groups: { [key: string]: { label: string; subLabel: string; items: ExpenseItem[] } } = {};

    for (const exp of filteredExpenses) {
      const expDate = parseISO(exp.date);
      const dateKey = format(expDate, 'yyyy-MM-dd');

      if (!groups[dateKey]) {
        let label = format(expDate, 'MMMM d, yyyy');
        let subLabel = format(expDate, 'EEEE');

        if (isToday(expDate)) {
          label = 'Today';
          subLabel = format(expDate, 'MMMM d');
        } else if (isYesterday(expDate)) {
          label = 'Yesterday';
          subLabel = format(expDate, 'MMMM d');
        }

        groups[dateKey] = { label, subLabel, items: [] };
      }

      groups[dateKey].items.push(exp);
    }

    return Object.entries(groups);
  }, [filteredExpenses]);

  // Actions
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateExpense(id);
      toast.success('Expense duplicated to today');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate');
    }
  };

  const totalFilteredSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-5">
      {/* Header & Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
            Expenses
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Showing {filteredExpenses.length} transactions &bull; Total:{' '}
            <strong className="text-slate-900 dark:text-zinc-100">
              {formatCurrency(totalFilteredSum, currency)}
            </strong>
          </p>
        </div>

        <Button
          onClick={() => {
            const addBtn = document.querySelector('button[aria-label="Add Expense"]') as HTMLButtonElement;
            if (addBtn) addBtn.click();
          }}
          className="font-semibold gap-1.5 rounded-xl shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardContent className="p-4 space-y-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by description, merchant, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Cycle selector */}
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

            {/* Category filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Payment method filter */}
            <select
              value={selectedPaymentMethodId}
              onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Payment Methods</option>
              {paymentMethods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Sort order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-xs font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date-desc">Newest Date First</option>
              <option value="date-asc">Oldest Date First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredExpenses.length === 0 && (
        <Card className="border-dashed border-2 border-slate-300 dark:border-zinc-800 p-8 text-center">
          <CardContent className="p-0 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                No expenses found
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                No transactions match your search criteria. Try clearing filters or record a new expense.
              </p>
            </div>
            <Button
              onClick={() => {
                setSearch('');
                setSelectedCategoryId('all');
                setSelectedPaymentMethodId('all');
                setSelectedCycleId('all');
              }}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* MOBILE VIEW: Grouped by Date cards */}
      <div className="md:hidden space-y-5">
        {groupedExpenses.map(([dateKey, group]) => {
          const groupTotal = group.items.reduce((s, i) => s + i.amount, 0);

          return (
            <div key={dateKey} className="space-y-2">
              {/* Date Header: e.g. "Today" or "September 6" */}
              <div className="flex items-center justify-between px-1 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-zinc-100 mr-2">
                    {group.label}
                  </span>
                  <span className="text-slate-500 dark:text-zinc-400">{group.subLabel}</span>
                </div>
                <span className="font-semibold text-slate-600 dark:text-zinc-400">
                  {formatCurrency(groupTotal, currency)}
                </span>
              </div>

              {/* Expense Cards in this date group */}
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedExpense(item)}
                    className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-black shadow-2xs flex items-center justify-between gap-3 active:scale-[0.99] transition-transform cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.category?.color || '#10b981' }}
                      >
                        <DynamicIcon name={item.category?.icon} size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {item.description}
                          </span>
                          {item.isInvestment && (
                            <Badge variant="investment" className="text-[9px] px-1.5 py-0">
                              SIP
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                          {item.category?.name || 'Category'}
                          {item.paymentMethod && ` &bull; ${item.paymentMethod.name}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                        {formatCurrency(item.amount, currency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Full Data Table */}
      <div className="hidden md:block">
        <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-black border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 pl-5">Date</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Salary Cycle</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredExpenses.map((item) => {
                  const dateFormatted = format(parseISO(item.date), 'MMM d, yyyy');

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="p-3.5 pl-5 font-medium text-slate-700 dark:text-zinc-300">
                        {dateFormatted}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: item.category?.color || '#10b981' }}
                          >
                            <DynamicIcon name={item.category?.icon} size={12} />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-zinc-100">
                            {item.category?.name || 'Category'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-slate-900 dark:text-zinc-100">
                          {item.description}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-xs">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-zinc-400">
                        {item.salaryMonth?.name || '—'}
                      </td>

                      <td className="p-3.5 text-slate-600 dark:text-zinc-400">
                        {item.paymentMethod?.name || '—'}
                      </td>

                      <td className="p-3.5 text-right font-bold text-slate-900 dark:text-zinc-50">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.isInvestment && (
                            <Badge variant="investment" className="text-[9px] px-1 py-0">
                              SIP
                            </Badge>
                          )}
                          <span>{formatCurrency(item.amount, currency)}</span>
                        </div>
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                            onClick={() => setEditingExpense(item)}
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                            onClick={() => handleDuplicate(item.id)}
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Details Modal (on mobile tap) */}
      <ExpenseDetailsModal
        expense={selectedExpense}
        isOpen={Boolean(selectedExpense)}
        onClose={() => setSelectedExpense(null)}
        currency={currency}
        onEdit={(exp) => {
          setSelectedExpense(null);
          setEditingExpense(exp);
        }}
        onDuplicate={(id) => {
          setSelectedExpense(null);
          handleDuplicate(id);
        }}
        onDelete={(id) => {
          setSelectedExpense(null);
          handleDelete(id);
        }}
      />

      {/* Edit Modal (with cross-cycle boundary alert) */}
      <EditExpenseModal
        expense={editingExpense}
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        categories={categories}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
