'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  User,
  KeyRound,
  Edit,
  Trash2,
  Search,
  Receipt,
  CalendarDays,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CreateUserModal } from './create-user-modal';
import { EditUserModal } from './edit-user-modal';
import { ResetPasswordModal } from './reset-password-modal';
import { deleteUserAction } from '@/actions/user-actions';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  name: string;
  username: string | null;
  email: string;
  role: string;
  defaultSalary: number;
  currency: string;
  timezone: string;
  createdAt: Date | string;
  _count: {
    expenses: number;
    salaryMonths: number;
    recurringExpenses: number;
  };
}

interface UserManagementViewProps {
  initialUsers: UserItem[];
  currentUserId: string;
}

export function UserManagementView({ initialUsers, currentUserId }: UserManagementViewProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [resettingUser, setResettingUser] = useState<UserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const regularCount = users.filter((u) => u.role === 'USER').length;

  const handleRefresh = () => {
    router.refresh();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await deleteUserAction(deletingUser.id);
      toast.success(`User "${deletingUser.name}" deleted`);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      setDeletingUser(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              User Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Create, view, manage roles, and reset passwords for system accounts.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl text-xs font-bold gap-1.5 shadow-xs tap-spring cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Total Users
              </div>
              <div className="text-2xl font-extrabold text-foreground mt-0.5">
                {users.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Administrators
              </div>
              <div className="text-2xl font-extrabold text-foreground mt-0.5">
                {adminCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Regular Users
              </div>
              <div className="text-2xl font-extrabold text-foreground mt-0.5">
                {regularCount}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <Input
          type="text"
          placeholder="Search by name, username, email, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-xs"
        />
      </div>

      {/* MOBILE VIEW: Cards */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map((u) => {
          const isMe = u.id === currentUserId;
          const createdStr = typeof u.createdAt === 'string'
            ? format(parseISO(u.createdAt), 'MMM d, yyyy')
            : format(u.createdAt, 'MMM d, yyyy');

          return (
            <Card key={u.id} className="border-border shadow-2xs p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-foreground">
                        {u.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-semibold px-1.5 py-0 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      @{u.username || 'unspecified'} &bull; {u.email}
                    </div>
                  </div>
                </div>

                <Badge
                  variant={u.role === 'ADMIN' ? 'default' : 'secondary'}
                  className="text-[10px] px-2 py-0.5"
                >
                  {u.role === 'ADMIN' ? (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      ADMIN
                    </span>
                  ) : (
                    'USER'
                  )}
                </Badge>
              </div>

              {/* Counts */}
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-slate-400" />
                  {u._count.expenses} expenses
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                  {u._count.salaryMonths} cycles
                </span>
                <span className="text-[11px] ml-auto">
                  Joined {createdStr}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingUser(u)}
                  className="rounded-lg text-xs h-8 px-2.5"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResettingUser(u)}
                  className="rounded-lg text-xs h-8 px-2.5"
                >
                  <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Pass
                </Button>
                {!isMe && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingUser(u)}
                    className="rounded-lg text-xs h-8 px-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Table */}
      <div className="hidden md:block">
        <Card className="border-border shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-black border-b border-border text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4 pl-6">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Data Logged</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filteredUsers.map((u) => {
                  const isMe = u.id === currentUserId;
                  const createdStr = typeof u.createdAt === 'string'
                    ? format(parseISO(u.createdAt), 'MMM d, yyyy')
                    : format(u.createdAt, 'MMM d, yyyy');

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/60 transition-colors"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/20">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <span>{u.name}</span>
                              {isMe && (
                                <span className="text-[10px] font-semibold px-1.5 py-0 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                              @{u.username || 'unspecified'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-medium text-foreground">
                        {u.email}
                      </td>

                      <td className="p-4">
                        <Badge
                          variant={u.role === 'ADMIN' ? 'default' : 'secondary'}
                          className="text-[10px] font-bold"
                        >
                          {u.role === 'ADMIN' ? (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              ADMIN
                            </span>
                          ) : (
                            'USER'
                          )}
                        </Badge>
                      </td>

                      <td className="p-4 text-slate-500 dark:text-zinc-400">
                        {u._count.expenses} expenses &bull; {u._count.salaryMonths} cycles
                      </td>

                      <td className="p-4 text-slate-500 dark:text-zinc-400">
                        {createdStr}
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(u)}
                            className="h-8 px-2.5 text-xs tap-spring"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            <span>Edit</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResettingUser(u)}
                            className="h-8 px-2.5 text-xs text-amber-600 dark:text-amber-400 tap-spring"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5 mr-1" />
                            <span>Password</span>
                          </Button>

                          {!isMe ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingUser(u)}
                              className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 tap-spring"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <div className="w-8" />
                          )}
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

      {/* Create Modal */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleRefresh}
      />

      {/* Edit Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUpdated={handleRefresh}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        user={resettingUser}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="max-w-md p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete User Account</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs text-slate-600 dark:text-zinc-300">
            <p>
              Are you sure you want to permanently delete user <strong className="text-foreground">{deletingUser?.name}</strong> (@{deletingUser?.username})?
            </p>
            <p className="text-rose-600 dark:text-rose-400 font-medium">
              This action cannot be undone. All expenses, cycles, and data belonging to this user will be removed.
            </p>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingUser(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="rounded-xl font-bold gap-1"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
