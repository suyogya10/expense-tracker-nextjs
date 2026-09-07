import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginView } from '@/components/auth/login-view';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return <LoginView />;
}
