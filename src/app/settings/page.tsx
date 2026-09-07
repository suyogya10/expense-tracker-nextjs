import { getCurrentUser } from '@/lib/auth';
import { getCategories, getPaymentMethods } from '@/actions/category-actions';
import { SettingsView } from '@/components/settings/settings-view';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [user, categories, paymentMethods] = await Promise.all([
    getCurrentUser(),
    getCategories(),
    getPaymentMethods(),
  ]);

  if (!user) {
    redirect('/login');
  }

  return (
    <SettingsView
      user={user}
      categories={categories}
      paymentMethods={paymentMethods}
    />
  );
}
