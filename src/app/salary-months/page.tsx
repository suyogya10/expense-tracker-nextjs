import { getAllSalaryCycles } from '@/actions/salary-actions';
import { getCurrentUser } from '@/lib/auth';
import { SalaryHistoryView } from '@/components/salary-months/salary-history-view';

export const dynamic = 'force-dynamic';

export default async function SalaryMonthsPage() {
  const [cycles, user] = await Promise.all([
    getAllSalaryCycles(),
    getCurrentUser(),
  ]);

  return (
    <SalaryHistoryView
      cycles={cycles}
      currency={user?.currency || 'Rs.'}
    />
  );
}
