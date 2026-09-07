import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { LayoutShell } from '@/components/layout-shell';
import { PwaRegister } from '@/components/pwa-register';
import { Toaster } from 'sonner';
import { getActiveSalaryCycle } from '@/actions/salary-actions';
import { getCategories, getPaymentMethods } from '@/actions/category-actions';
import { getCurrentUser } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Expense Tracker — Salary Cycle PWA',
  description: 'Modern personal finance web app and PWA driven by dynamic salary cycles.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Expense PWA',
  },
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Accessibility compliant; iOS zoom prevented via 16px font-size in CSS
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [currentUser, activeCycle, categories, paymentMethods] = await Promise.all([
    getCurrentUser(),
    getActiveSalaryCycle(),
    getCategories(),
    getPaymentMethods(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-indigo-500/25 selection:text-indigo-950 dark:selection:text-indigo-100`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutShell
            currentUser={
              currentUser
                ? {
                    id: currentUser.id,
                    name: currentUser.name,
                    username: currentUser.username,
                    email: currentUser.email,
                    role: currentUser.role,
                  }
                : null
            }
            activeCycle={
              activeCycle
                ? {
                    id: activeCycle.id,
                    name: activeCycle.name,
                    startDate: activeCycle.startDate,
                    endDate: activeCycle.endDate,
                  }
                : null
            }
            categories={categories.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              color: c.color,
              isInvestment: c.isInvestment,
            }))}
            paymentMethods={paymentMethods.map((p) => ({
              id: p.id,
              name: p.name,
              icon: p.icon,
            }))}
          >
            {children}
          </LayoutShell>
          <Toaster position="top-center" richColors />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
