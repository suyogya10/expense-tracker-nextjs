import { getRecurringExpenses } from '@/actions/recurring-actions';
import { getActiveSalaryCycle } from '@/actions/salary-actions';
import { getCategories, getPaymentMethods } from '@/actions/category-actions';
import { getCurrentUser } from '@/lib/auth';
import { RecurringListView } from '@/components/recurring/recurring-list-view';

export const dynamic = 'force-dynamic';

export default async function RecurringPage() {
  const [recurring, activeCycle, categories, paymentMethods, user] = await Promise.all([
    getRecurringExpenses(),
    getActiveSalaryCycle(),
    getCategories(),
    getPaymentMethods(),
    getCurrentUser(),
  ]);

  return (
    <RecurringListView
      recurringExpenses={recurring}
      activeCycle={activeCycle}
      categories={categories}
      paymentMethods={paymentMethods}
      currency={user?.currency || 'Rs.'}
    />
  );
}
