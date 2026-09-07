import { getCurrentUser } from '@/lib/auth';
import { getRecurringExpenses } from '@/actions/recurring-actions';
import { CreateCycleForm } from '@/components/salary-months/create-cycle-form';

export const dynamic = 'force-dynamic';

export default async function NewSalaryMonthPage() {
  const [user, recurring] = await Promise.all([
    getCurrentUser(),
    getRecurringExpenses(),
  ]);

  return (
    <div className="py-2">
      <CreateCycleForm
        defaultSalary={user?.defaultSalary || 60000}
        recurringRules={recurring}
        currency={user?.currency || 'Rs.'}
      />
    </div>
  );
}
