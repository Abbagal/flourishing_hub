'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { getStoredUser, logout, syncStoredUser } from '@/lib/auth';
import type { AuthPayload, UserRole } from '@/types';
import { getRolePath } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  expectedRole?: UserRole;
}

export default function DashboardLayout({ children, expectedRole }: DashboardLayoutProps) {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/login');
      return;
    }

    setUser(stored);

    const syncUser = async () => {
      const fresh = await syncStoredUser();
      if (!fresh) {
        logout();
        router.push('/login');
        return;
      }

      const roleMatches = !expectedRole
        || fresh.role === expectedRole
        || (expectedRole === 'student' && fresh.role === 'volunteer');

      if (!roleMatches) {
        router.push(getRolePath(fresh.role));
        return;
      }

      setUser(fresh);
    };

    void syncUser();
  }, [expectedRole, router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse" />
          <p className="text-sm text-white/40 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark">
      <Sidebar role={user.role} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar userName={user.name} role={user.role} />
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
