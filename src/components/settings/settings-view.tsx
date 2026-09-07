'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon } from '@/components/dynamic-icon';
import { updateUserProfile, exportAllDataJSON, exportExpensesCSV } from '@/actions/data-actions';
import { createCategory, deleteCategory, createPaymentMethod, deletePaymentMethod } from '@/actions/category-actions';
import { changePasswordAction, changeUsernameAction } from '@/actions/auth-actions';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  User,
  Settings,
  Download,
  Upload,
  Palette,
  Tag,
  CreditCard,
  Plus,
  Trash2,
  Check,
  Moon,
  Sun,
  Laptop,
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  AtSign,
  Users,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SettingsViewProps {
  user: {
    id: string;
    email: string;
    username?: string | null;
    name: string;
    role?: string;
    currency: string;
    timezone: string;
    defaultSalary: number;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    isInvestment: boolean;
  }>;
  paymentMethods: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export function SettingsView({ user, categories, paymentMethods }: SettingsViewProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Profile Form
  const [name, setName] = useState(user.name);
  const [currency, setCurrency] = useState(user.currency || 'Rs.');
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Kathmandu');
  const [defaultSalary, setDefaultSalary] = useState(String(user.defaultSalary || 60000));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [newCatIsInvestment, setNewCatIsInvestment] = useState(false);
  const [isAddingCat, setIsAddingCat] = useState(false);

  // New Payment Method Form
  const [newPmName, setNewPmName] = useState('');
  const [isAddingPm, setIsAddingPm] = useState(false);

  // Profile update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateUserProfile({
        name,
        currency,
        timezone,
        defaultSalary: parseFloat(defaultSalary) || 60000,
      });
      toast.success('Profile preferences updated');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Username & Password state
  const [username, setUsername] = useState(user.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Save username
  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setIsSavingUsername(true);
    try {
      await changeUsernameAction({ newUsername: username.trim() });
      toast.success(`Username updated to @${username.trim()}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Change password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please enter your current and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 4) {
      toast.error('New password must be at least 4 characters long');
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePasswordAction({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsAddingCat(true);
    try {
      await createCategory({
        name: newCatName.trim(),
        icon: newCatIcon,
        color: newCatColor,
        isInvestment: newCatIsInvestment,
      });
      toast.success(`Category ${newCatName} created`);
      setNewCatName('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setIsAddingCat(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string, catName: string) => {
    if (!confirm(`Delete category ${catName}?`)) return;
    try {
      await deleteCategory(id);
      toast.success(`Category ${catName} deleted`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  // Add Payment Method
  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmName.trim()) return;
    setIsAddingPm(true);
    try {
      await createPaymentMethod({
        name: newPmName.trim(),
        icon: 'CreditCard',
      });
      toast.success(`Payment method ${newPmName} created`);
      setNewPmName('');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create payment method');
    } finally {
      setIsAddingPm(false);
    }
  };

  // Delete Payment Method
  const handleDeletePaymentMethod = async (id: string, pmName: string) => {
    if (!confirm(`Delete payment method ${pmName}?`)) return;
    try {
      await deletePaymentMethod(id);
      toast.success(`Payment method ${pmName} deleted`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete payment method');
    }
  };

  // Export JSON
  const handleExportJSON = async () => {
    try {
      const data = await exportAllDataJSON();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expense_tracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup JSON downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const csvStr = await exportExpensesCSV();
      const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Expenses CSV downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Export failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-50">
          Settings &amp; Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Customize currency, defaults, categories, appearance, and export your data.
        </p>
      </div>

      {/* 1. Profile & Preferences */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Profile &amp; Financial Defaults</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Display Name
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Email
                </label>
                <Input type="email" disabled value={user.email} className="bg-slate-50 opacity-70" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Currency Symbol
                </label>
                <Input
                  type="text"
                  required
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Default Salary (Rs.)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={defaultSalary}
                  onChange={(e) => setDefaultSalary(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Timezone
                </label>
                <Input
                  type="text"
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-xl text-xs font-semibold"
            >
              {isSavingProfile ? 'Saving...' : 'Save Preferences'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Security & Credentials */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Security &amp; Credentials</span>
            </CardTitle>
            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'} className="text-[10px] font-bold">
              {user.role === 'ADMIN' ? 'ADMINISTRATOR' : 'REGULAR USER'}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Manage your account username, login password, and administrator privileges.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {/* If Admin, show link to User Management */}
          {user.role === 'ADMIN' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>User Management Console</span>
                </div>
                <div className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                  You have full privileges to create, view, edit roles, and delete users.
                </div>
              </div>
              <Link href="/users">
                <Button size="sm" className="rounded-xl text-xs font-bold gap-1 shadow-xs tap-spring shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Users</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Change Username Form */}
          <form onSubmit={handleSaveUsername} className="space-y-3 pt-1">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-indigo-500" />
              <span>Account Username</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-md">
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or your_name"
                className="text-xs h-10"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isSavingUsername || username === (user.username || '')}
                className="rounded-xl text-xs font-semibold shrink-0"
              >
                {isSavingUsername ? 'Saving...' : 'Update Username'}
              </Button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleSavePassword} className="space-y-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              <span>Change Password</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Current Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSavingPassword || !currentPassword || !newPassword}
              className="rounded-xl text-xs font-semibold"
            >
              {isSavingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>Changing Password...</span>
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 3. Appearance & Theme */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-3 gap-3 max-w-sm">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-semibold cursor-pointer tap-spring transition-all ${
                theme === 'light'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200 shadow-xs'
                  : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-semibold cursor-pointer tap-spring transition-all ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-black text-indigo-300 ring-2 ring-indigo-500/30 shadow-xs'
                  : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark (AMOLED)</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 text-xs font-semibold cursor-pointer tap-spring transition-all ${
                theme === 'system'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-black dark:text-indigo-300 shadow-xs'
                  : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300'
              }`}
            >
              <Laptop className="w-5 h-5 text-slate-500" />
              <span>System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Data Export & Ownership */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Data Ownership &amp; Export</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Export your financial transactions, salary cycles, and budgets anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 flex flex-wrap gap-3">
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-xl text-xs gap-1.5 font-semibold"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export Expenses (CSV)</span>
          </Button>

          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="rounded-xl text-xs gap-1.5 font-semibold"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Full Backup (JSON)</span>
          </Button>
        </CardContent>
      </Card>

      {/* 4. Categories Management */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Categories ({categories.length})</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Add custom categories or toggle investment classification.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-48">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                New Category Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Pet Care, Gadgets"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="h-10 text-xs"
              />
            </div>

            <div className="w-24">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Color
              </label>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 p-1 cursor-pointer bg-white dark:bg-zinc-900"
              />
            </div>

            <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
              <input
                type="checkbox"
                id="newCatInv"
                checked={newCatIsInvestment}
                onChange={(e) => setNewCatIsInvestment(e.target.checked)}
                className="accent-purple-600 cursor-pointer"
              />
              <label htmlFor="newCatInv" className="cursor-pointer text-slate-700 dark:text-zinc-300">
                Is Investment
              </label>
            </div>

            <Button
              type="submit"
              disabled={isAddingCat || !newCatName.trim()}
              size="sm"
              className="h-10 rounded-xl text-xs gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </Button>
          </form>

          {/* Categories Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/30 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    <DynamicIcon name={c.icon} size={12} />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                    {c.name}
                  </span>
                  {c.isInvestment && (
                    <Badge variant="investment" className="text-[8px] px-1 py-0">
                      SIP
                    </Badge>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-400 hover:text-rose-600 rounded-md"
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 5. Payment Methods Management */}
      <Card className="border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Payment Methods ({paymentMethods.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleAddPaymentMethod} className="flex gap-2">
            <Input
              type="text"
              placeholder="e.g. PayPal, Apple Pay"
              value={newPmName}
              onChange={(e) => setNewPmName(e.target.value)}
              className="h-10 text-xs max-w-xs"
            />
            <Button
              type="submit"
              disabled={isAddingPm || !newPmName.trim()}
              size="sm"
              className="h-10 rounded-xl text-xs gap-1 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 pt-1">
            {paymentMethods.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-800 dark:text-zinc-200"
              >
                <span>{p.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeletePaymentMethod(p.id, p.name)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
