import { getCurrentUser } from '@/lib/auth';
import { getUsersAction } from '@/actions/user-actions';
import { redirect } from 'next/navigation';
import { UserManagementView } from '@/components/users/user-management-view';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'ADMIN') {
    redirect('/');
  }

  const users = await getUsersAction();

  return (
    <UserManagementView
      initialUsers={users}
      currentUserId={currentUser.id}
    />
  );
}
