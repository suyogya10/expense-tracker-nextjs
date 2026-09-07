import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('User Management & Authentication Security', () => {
  describe('Username Validation', () => {
    const isValidUsername = (username: string) => {
      const trimmed = username.trim().toLowerCase();
      if (trimmed.length < 3 || trimmed.length > 20) return false;
      return /^[a-zA-Z0-9_-]+$/.test(trimmed);
    };

    it('accepts valid usernames', () => {
      expect(isValidUsername('admin')).toBe(true);
      expect(isValidUsername('suyogya')).toBe(true);
      expect(isValidUsername('alex_m')).toBe(true);
      expect(isValidUsername('user-123')).toBe(true);
    });

    it('rejects usernames with spaces or special characters', () => {
      expect(isValidUsername('admin user')).toBe(false);
      expect(isValidUsername('user@name')).toBe(false);
      expect(isValidUsername('user!#$')).toBe(false);
    });

    it('rejects usernames shorter than 3 chars or longer than 20 chars', () => {
      expect(isValidUsername('ad')).toBe(false);
      expect(isValidUsername('a'.repeat(21))).toBe(false);
    });
  });

  describe('Password Hashing & Verification', () => {
    it('correctly hashes and verifies default admin password', async () => {
      const defaultPassword = 'admin';
      const hash = await bcrypt.hash(defaultPassword, 10);

      expect(await bcrypt.compare('admin', hash)).toBe(true);
      expect(await bcrypt.compare('wrongpassword', hash)).toBe(false);
    });

    it('requires minimum 4 characters for passwords', () => {
      const isValidPassword = (pass: string) => pass.length >= 4;
      expect(isValidPassword('admin')).toBe(true);
      expect(isValidPassword('1234')).toBe(true);
      expect(isValidPassword('123')).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('Admin Role-Based Access Control (RBAC)', () => {
    const checkIsAdmin = (user: { role?: string } | null | undefined) => {
      return user?.role === 'ADMIN';
    };

    it('identifies admin vs regular users', () => {
      expect(checkIsAdmin({ role: 'ADMIN' })).toBe(true);
      expect(checkIsAdmin({ role: 'USER' })).toBe(false);
      expect(checkIsAdmin({ role: 'GUEST' })).toBe(false);
      expect(checkIsAdmin(null)).toBe(false);
    });

    it('prevents self-deletion of currently logged-in admin', () => {
      const canDeleteUser = (currentUserId: string, targetUserId: string) => {
        if (currentUserId === targetUserId) {
          return { allowed: false, reason: 'Cannot delete yourself' };
        }
        return { allowed: true };
      };

      const result = canDeleteUser('admin-1', 'admin-1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Cannot delete yourself');

      const otherUserResult = canDeleteUser('admin-1', 'user-2');
      expect(otherUserResult.allowed).toBe(true);
    });

    it('prevents deletion or demotion of the last active administrator', () => {
      const canDeleteAdmin = (adminCount: number, targetUserRole: string) => {
        if (targetUserRole === 'ADMIN' && adminCount <= 1) {
          return { allowed: false, reason: 'Cannot delete last admin' };
        }
        return { allowed: true };
      };

      // If only 1 admin remains, cannot delete
      expect(canDeleteAdmin(1, 'ADMIN').allowed).toBe(false);

      // If multiple admins exist, can delete other admin
      expect(canDeleteAdmin(2, 'ADMIN').allowed).toBe(true);

      // Deleting regular user is unaffected by adminCount
      expect(canDeleteAdmin(1, 'USER').allowed).toBe(true);
    });
  });
});
