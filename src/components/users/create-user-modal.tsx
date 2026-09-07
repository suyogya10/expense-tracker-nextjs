'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUserAction } from '@/actions/user-actions';
import { UserPlus, Shield, User, Lock, Mail, AtSign, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'USER' | 'ADMIN'>('USER');
  const [defaultSalary, setDefaultSalary] = useState('60000');
  const [currency, setCurrency] = useState('Rs.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('USER');
    setDefaultSalary('60000');
    setCurrency('Rs.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createUserAction({
        name,
        username,
        email,
        password,
        role,
        defaultSalary: parseFloat(defaultSalary) || 60000,
        currency,
      });

      toast.success(`User @${username} created with ${role} privileges`);
      resetForm();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-zinc-800">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Create New User</span>
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
              placeholder="e.g. Alex Morgan"
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
                placeholder="alex_m"
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
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Initial Password *
            </label>
            <Input
              type="password"
              required
              placeholder="Minimum 4 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Account Role *
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
                  <div className="text-[10px] text-slate-500 dark:text-zinc-400">Full CRUD user access</div>
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
                placeholder="60000"
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
                placeholder="Rs."
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
                  <span>Creating User...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create User</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
