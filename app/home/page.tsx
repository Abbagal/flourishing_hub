'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sparkles, Calendar, ArrowRight, Star, MapPin, Clock, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { eventRegistrationRequest, eventsRequest, volunteerRegistrationRequest } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { formatDate, formatTime, getRolePath } from '@/lib/utils';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import type { AuthPayload, FrontendEvent } from '@/types';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [user, setUser] = useState<AuthPayload | null>(null);
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const router = useRouter();

  const loadEvents = async () => {
    const data = await eventsRequest();
    setEvents(data);
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored) {
      router.push('/login');
      return;
    }

    setUser(stored);
    void loadEvents()
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load events');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const dashboardPath = user ? getRolePath(user.role) : '/login';
  const roleLabel = user ? ({
    student: 'Student',
    instructor: 'Instructor',
    admin: 'Administrator',
    volunteer: 'Volunteer',
    'associate-instructor': 'Associate Instructor',
  }[user.role]) : '';

  const activeEvent = useMemo(() => {
    const now = new Date();
    return events.find((event) => new Date(`${event.date}T${event.time}:00`) >= now) ?? events[0] ?? null;
  }, [events]);

  const upcomingEvents = useMemo(() => (
    activeEvent ? events.filter((event) => event.id !== activeEvent.id) : events
  ), [activeEvent, events]);

  const handleStudentRegister = async (eventId: string, isRegistered: boolean) => {
    setBusyEventId(eventId);
    try {
      await eventRegistrationRequest(eventId, !isRegistered);
      await loadEvents();
      toast.success(isRegistered ? 'Registration removed' : 'Registered successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update registration');
    } finally {
      setBusyEventId(null);
    }
  };

  const handleVolunteerToggle = async (eventId: string, isVolunteerRegistered: boolean) => {
    setBusyEventId(eventId);
    try {
      await volunteerRegistrationRequest(eventId, !isVolunteerRegistered);
      await loadEvents();
      toast.success(isVolunteerRegistered ? 'Volunteer registration removed' : 'Volunteer registration saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update volunteer registration');
    } finally {
      setBusyEventId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar userName={user.name} role={user.role} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-white/50 text-sm mb-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              <h1 className="text-3xl font-black text-white mb-2">
                Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="text-white/50 text-sm">
                {roleLabel} · {user.department ?? 'IIT Bombay'}
              </p>
            </div>
            <Link href={dashboardPath}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="btn-primary px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" /> Go to Dashboard <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {activeEvent && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Featured Event</h2>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl overflow-hidden border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.12)]"
              style={{ background: 'linear-gradient(135deg, #1A1A2E 0%, #13131f 100%)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 to-transparent pointer-events-none" />
              <div className="relative z-10 p-8">
                <div className="flex items-start justify-between gap-6 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                        Live Backend Event
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-500/15 text-blue-400 border-blue-500/30 uppercase">
                        {activeEvent.type}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{activeEvent.title}</h3>
                    <p className="text-white/50 text-sm mb-4 max-w-xl">{activeEvent.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-white/60">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-primary" />
                        {formatDate(activeEvent.date)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        {formatTime(activeEvent.time)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-accent" />
                        {activeEvent.venue}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        {activeEvent.registeredCount} / {activeEvent.capacity}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 shrink-0">
                    {user.role === 'student' && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => void handleStudentRegister(activeEvent.id, Boolean(activeEvent.isRegistered))}
                        disabled={busyEventId === activeEvent.id}
                        className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm disabled:opacity-60"
                      >
                        {activeEvent.isRegistered ? 'Registered' : 'Register Now'}
                      </motion.button>
                    )}
                    {user.role === 'volunteer' && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => void handleVolunteerToggle(activeEvent.id, Boolean(activeEvent.isVolunteerRegistered))}
                        disabled={busyEventId === activeEvent.id}
                        className={`px-6 py-3 rounded-xl font-semibold text-sm border transition-all disabled:opacity-60 ${
                          activeEvent.isVolunteerRegistered
                            ? 'bg-accent/20 text-accent border-accent/30'
                            : 'bg-white/5 text-white/70 border-white/15 hover:bg-accent/10 hover:text-accent hover:border-accent/30'
                        }`}
                      >
                        {activeEvent.isVolunteerRegistered ? 'Volunteered' : 'Register as Volunteer'}
                      </motion.button>
                    )}
                    {(user.role === 'instructor' || user.role === 'associate-instructor') && (
                      <Link href={dashboardPath}>
                        <motion.button whileTap={{ scale: 0.97 }} className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm">
                          View Session
                        </motion.button>
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link href="/admin#events">
                        <motion.button whileTap={{ scale: 0.97 }} className="btn-primary px-6 py-3 rounded-xl font-semibold text-sm">
                          Manage Event
                        </motion.button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Upcoming Events</h2>
          {loading ? (
            <div className="glass-card rounded-2xl p-6 text-sm text-white/50">Loading events...</div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcomingEvents.map((event, index) => (
                <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                  <EventCard
                    event={event}
                    onRegister={user.role === 'student' ? () => void handleStudentRegister(event.id, Boolean(event.isRegistered)) : undefined}
                    registerLabel={busyEventId === event.id ? 'Working...' : undefined}
                    isRegistered={Boolean(event.isRegistered)}
                    showVolunteerButton={user.role === 'volunteer'}
                    onVolunteer={user.role === 'volunteer' ? () => void handleVolunteerToggle(event.id, Boolean(event.isVolunteerRegistered)) : undefined}
                    isVolunteered={Boolean(event.isVolunteerRegistered)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 text-sm text-white/50">No upcoming events available right now.</div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'My Dashboard', href: dashboardPath, icon: Sparkles, color: 'primary' },
              { label: 'All Events', href: `${dashboardPath}#events`, icon: Calendar, color: 'teal' },
              { label: 'Schedule', href: `${dashboardPath}#schedule`, icon: Clock, color: 'yellow' },
              { label: 'History', href: `${dashboardPath}#history`, icon: Star, color: 'purple' },
            ].map(({ label, href, icon: Icon, color }) => (
              <Link key={label} href={href}>
                <motion.div whileHover={{ y: -3 }} className="glass-card rounded-2xl p-4 text-center cursor-pointer group transition-all hover:border-primary/30">
                  <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    color === 'primary' ? 'bg-primary/15 text-primary' :
                    color === 'teal' ? 'bg-accent/15 text-accent' :
                    color === 'yellow' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-primary/15 text-primary'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">{label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
