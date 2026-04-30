'use client';

import { Bell, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { getRoleLabel } from '@/lib/utils';
import type { Notification, UserRole } from '@/types';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NotificationDropdown from '@/components/NotificationDropdown';

const QUICK_LINKS: Record<UserRole, { label: string; href: string }[]> = {
  student: [
    { label: 'Dashboard', href: '/student' },
    { label: 'My Modules', href: '/student#modules' },
    { label: 'Upcoming Events', href: '/student#events' },
    { label: 'Schedule', href: '/student#schedule' },
    { label: 'History', href: '/student#history' },
  ],
  instructor: [
    { label: 'Dashboard', href: '/instructor' },
    { label: 'My Sessions', href: '/instructor#sessions' },
    { label: 'Participants', href: '/instructor#participants' },
    { label: 'Schedule', href: '/instructor#schedule' },
  ],
  admin: [
    { label: 'Overview', href: '/admin' },
    { label: 'Analytics', href: '/admin#analytics' },
    { label: 'Members', href: '/admin#students' },
    { label: 'Events', href: '/admin#events' },
    { label: 'Roles', href: '/admin#roles' },
    { label: 'Import Jobs', href: '/admin#settings' },
  ],
  volunteer: [
    { label: 'Dashboard', href: '/student' },
    { label: 'My Modules', href: '/student#modules' },
    { label: 'Upcoming Events', href: '/student#events' },
    { label: 'Volunteer Options', href: '/student#events' },
    { label: 'Calendar', href: '/student#history' },
  ],
  'associate-instructor': [
    { label: 'Dashboard', href: '/associate-instructor' },
    { label: 'Attendance', href: '/associate-instructor#attendance' },
    { label: 'Quizzes', href: '/associate-instructor#quizzes' },
    { label: 'Registrants', href: '/associate-instructor#registrants' },
  ],
};

interface NavbarProps {
  userName: string;
  role: UserRole;
  notifications?: number;
}

export default function Navbar({ userName, role, notifications = 3 }: NavbarProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const quickLinks = QUICK_LINKS[role] ?? QUICK_LINKS.student;
  const searchResults = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    if (!term) return quickLinks;
    return quickLinks.filter((item) => item.label.toLowerCase().includes(term));
  }, [quickLinks, searchValue]);
  const activityFeed = useMemo<Notification[]>(() => {
    if (role === 'admin') {
      return [
        { id: 'admin-1', type: 'general', message: 'Member filters and exports are connected to the live backend.', time: 'Just now', read: false },
        { id: 'admin-2', type: 'general', message: 'Completed event records now include attendance, feedback, and quiz summaries.', time: 'Today', read: false },
        { id: 'admin-3', type: 'reminder', message: 'Review recent import jobs in Settings before publishing new data.', time: 'Today', read: true },
      ];
    }
    if (role === 'associate-instructor') {
      return [
        { id: 'associate-1', type: 'general', message: 'Attendance saves to the backend in real time.', time: 'Just now', read: false },
        { id: 'associate-2', type: 'general', message: 'Quiz and feedback toggles are available for active sessions.', time: 'Today', read: true },
      ];
    }
    if (role === 'instructor') {
      return [
        { id: 'instructor-1', type: 'general', message: 'Session start updates the backend immediately.', time: 'Just now', read: false },
        { id: 'instructor-2', type: 'general', message: 'Participant and calendar data come from live registrations.', time: 'Today', read: true },
      ];
    }
    if (role === 'volunteer') {
      return [
        { id: 'volunteer-1', type: 'general', message: 'Volunteer support remains event-based and backed by live registrations.', time: 'Today', read: false },
      ];
    }
    return [
      { id: 'student-1', type: 'general', message: 'Event registration and check-in are using the live API.', time: 'Just now', read: false },
      { id: 'student-2', type: 'reminder', message: 'Open your calendar to view event details by date.', time: 'Today', read: true },
      { id: 'student-3', type: 'general', message: 'Dashboard modules and event history load from the backend.', time: 'Today', read: true },
    ];
  }, [role]);

  const handleNavigate = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setSearchValue('');
    setNotificationsOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0F0F1A]/80 backdrop-blur-xl sticky top-0 z-30"
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative">
          <motion.div
            animate={{ width: searchOpen ? 280 : 40 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden h-9"
          >
            <button
              onClick={() => setSearchOpen((open) => !open)}
              className="p-2.5 text-white/40 hover:text-white transition-colors shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchOpen && (
              <input
                autoFocus
                placeholder="Search pages and sections..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none pr-3"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchResults[0]) {
                    handleNavigate(searchResults[0].href);
                  }
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                    setSearchValue('');
                  }
                }}
              />
            )}
          </motion.div>
          {searchOpen && (
            <div className="absolute left-0 top-11 w-72 rounded-2xl border border-white/10 bg-[#13132A] p-2 shadow-2xl">
              <p className="px-2 py-1 text-[10px] uppercase tracking-widest text-white/30">Quick Links</p>
              <div className="space-y-1">
                {searchResults.length ? searchResults.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="w-full rounded-xl px-3 py-2 text-left text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </button>
                )) : (
                  <div className="px-3 py-2 text-sm text-white/40">No matching sections found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotificationsOpen((open) => !open)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          >
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {notifications}
              </span>
            )}
          </motion.button>
          <NotificationDropdown notifications={activityFeed} open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white leading-none">{userName}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{getRoleLabel(role)}</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white cursor-pointer shadow-glow-sm"
          >
            {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
