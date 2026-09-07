import { getExpenses } from '@/actions/expense-actions';
import { getCategories, getPaymentMethods } from '@/actions/category-actions';
import { getAllSalaryCycles, getActiveSalaryCycle } from '@/actions/salary-actions';
import { getCurrentUser } from '@/lib/auth';
import { ExpenseListView } from '@/components/expenses/expense-list-view';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const [expenses, categories, paymentMethods, salaryCycles, activeCycle, user] =
    await Promise.all([
      getExpenses(),
      getCategories(),
      getPaymentMethods(),
      getAllSalaryCycles(),
      getActiveSalaryCycle(),
      getCurrentUser(),
    ]);

  return (
    <ExpenseListView
      initialExpenses={expenses}
      categories={categories}
      paymentMethods={paymentMethods}
      salaryCycles={salaryCycles}
      activeCycleId={activeCycle?.id}
      currency={user?.currency || 'Rs.'}
    />
  );
}
