'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/navigation/sidebar';
import { Header } from '@/components/navigation/header';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { MoreMenuModal } from '@/components/navigation/more-menu-modal';
import { QuickAddModal } from '@/components/quick-add-modal';
import { useRouter, usePathname } from 'next/navigation';

export interface CurrentUserInfo {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: string;
}

interface LayoutShellProps {
  children: React.ReactNode;
  activeCycle?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  categories: Array<{ id: string; name: string; icon: string; color: string; isInvestment: boolean }>;
  paymentMethods: Array<{ id: string; name: string; icon: string }>;
  currentUser?: CurrentUserInfo | null;
}

export function LayoutShell({
  children,
  activeCycle,
  categories,
  paymentMethods,
  currentUser,
}: LayoutShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Unauthenticated clean view for /login
  if (pathname === '/login') {
    return (
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {children}
      </div>
    );
  }

  const handleExpenseCreated = () => {
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        activeCycleName={activeCycle?.name}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          activeCycle={activeCycle}
          currentUser={currentUser}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenMoreMenu={() => setIsMoreMenuOpen(true)}
        />
      </div>

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        categories={categories}
        paymentMethods={paymentMethods}
        onExpenseCreated={handleExpenseCreated}
      />

      {/* More Options Modal for Mobile */}
      <MoreMenuModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

