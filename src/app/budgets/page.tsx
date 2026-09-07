import { getCycleBudgets } from '@/actions/budget-actions';
import { getActiveSalaryCycle } from '@/actions/salary-actions';
import { getCategories } from '@/actions/category-actions';
import { getCurrentUser } from '@/lib/auth';
import { BudgetListView } from '@/components/budgets/budget-list-view';

export const dynamic = 'force-dynamic';

export default async function BudgetsPage() {
  const [activeCycle, categories, user] = await Promise.all([
    getActiveSalaryCycle(),
    getCategories(),
    getCurrentUser(),
  ]);

  const budgets = activeCycle ? await getCycleBudgets(activeCycle.id) : [];

  return (
    <BudgetListView
      budgets={budgets}
      activeCycle={activeCycle}
      categories={categories}
      currency={user?.currency || 'Rs.'}
    />
  );
}
