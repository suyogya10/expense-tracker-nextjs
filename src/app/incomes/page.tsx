import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { getActiveSalaryCycle, getAllSalaryCycles } from '@/actions/salary-actions';
import { IncomeListView } from '@/components/incomes/income-list-view';

export const dynamic = 'force-dynamic';

export default async function IncomesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [incomes, activeCycle, salaryCycles] = await Promise.all([
    prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      include: { salaryMonth: { select: { name: true } } },
    }),
    getActiveSalaryCycle(),
    getAllSalaryCycles(),
  ]);

  const serializedIncomes = incomes.map((i) => ({
    ...i,
    amount: Number(i.amount),
    date: i.date.toISOString(),
  }));

  return (
    <IncomeListView
      incomes={serializedIncomes}
      activeCycle={activeCycle}
      salaryCycles={salaryCycles}
      currency={user.currency}
    />
  );
}
