'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateUserAction } from '@/actions/user-actions';
import { Edit3, Shield, User, Mail, AtSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    username: string | null;
    email: string;
    role: string;
    defaultSalary: number;
    currency: string;
  } | null;
  onUpdated: () => void;
}

export function EditUserModal({ isOpen, onClose, user, onUpdated }: EditUserModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [defaultSalary, setDefaultSalary] = useState('60000');
  const [currency, setCurrency] = useState('Rs.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setUsername(user.username || '');
      setEmail(user.email);
      setRole((user.role as 'USER' | 'ADMIN') || 'USER');
      setDefaultSalary(String(user.defaultSalary || 60000));
      setCurrency(user.currency || 'Rs.');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim() || !username.trim() || !email.trim()) {
      toast.error('Name, username, and email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserAction(user.id, {
        name,
        username,
        email,
        role,
        defaultSalary: parseFloat(defaultSalary) || 60000,
        currency,
      });

      toast.success(`Updated user @${username}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit User Account</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
              Full Name *
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5" />
                Username *
              </label>
              <Input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Email *
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Role Privilege *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('USER')}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold tap-spring transition-all cursor-pointer ${
                  role === 'USER'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-black dark:text-indigo-200 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-slate-700 dark:text-zinc-300'
                }`}
              >
                <User className="w-4 h-4 text-slate-500" />
                <div className="text-left">
                  <div className="font-bold leading-tight">Regular User</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">Personal finances only</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-semibold tap-spring transition-all cursor-pointer ${
                  role === 'ADMIN'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 dark:border-indigo-500 dark:bg-black dark:text-indigo-200 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-black text-slate-700 dark:text-zinc-300'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <div className="text-left">
                  <div className="font-bold leading-tight">Administrator</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">Full user management</div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Default Salary (Rs.)
              </label>
              <Input
                type="number"
                step="0.01"
                value={defaultSalary}
                onChange={(e) => setDefaultSalary(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1">
                Currency Symbol
              </label>
              <Input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
