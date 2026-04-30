'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Calendar, Trophy, Clock, TrendingUp } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import ModuleCard from '@/components/ModuleCard';
import MiniCalendar from '@/components/MiniCalendar';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { StatCardSkeleton, ModuleCardSkeleton } from '@/components/ui/skeleton';
import { checkInRequest, dashboardRequest, eventRegistrationWithSessionRequest, eventsRequest, submitFeedbackRequest, volunteerRegistrationRequest } from '@/lib/api';
import { getGreeting, formatDate, formatTime } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import type { CalendarEventItem, FrontendEvent, Student, StudentCompletedEvent, StudentModule } from '@/types';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [student, setStudent] = useState<Student | null>(null);
  const [events, setEvents] = useState<FrontendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [selectedSessions, setSelectedSessions] = useState<Record<string, string>>({});
  const [completedEvents, setCompletedEvents] = useState<StudentCompletedEvent[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<Record<string, { eventRating: string; instructorRating: string; eventComment: string; instructorComment: string }>>({});

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.name ?? 'Student');

    const loadDashboard = async () => {
      try {
        const data = await dashboardRequest();
        const dashboard = data.dashboard as Student & { events?: FrontendEvent[] };
        setStudent(dashboard);
        setEvents(dashboard?.events ?? []);
        setCompletedEvents((dashboard as Student & { completedEvents?: StudentCompletedEvent[] }).completedEvents ?? []);
        setSelectedSessions(
          Object.fromEntries((dashboard?.events ?? []).map((event) => [event.id, event.selectedSessionId ?? event.sessions?.[0]?.id ?? '']))
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const handleRegister = async (eventId: string, eventTitle: string, isRegistered: boolean) => {
    try {
      const selectedModuleId = selectedSessions[eventId] || undefined;
      await eventRegistrationWithSessionRequest(eventId, { register: !isRegistered, moduleId: selectedModuleId });
      const refreshedEvents = await eventsRequest();
      setEvents(refreshedEvents);
      toast.success(isRegistered ? `Unregistered from ${eventTitle}` : `Registered for ${eventTitle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update registration';
      toast.error(message);
    }
  };

  const handleCheckIn = async (eventId: string, eventTitle: string) => {
    try {
      const selectedModuleId = selectedSessions[eventId] || undefined;
      await checkInRequest(eventId, selectedModuleId);
      const refreshedEvents = await eventsRequest();
      setEvents(refreshedEvents);
      toast.success(`Checked in for ${eventTitle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check in';
      toast.error(message);
    }
  };

  const handleFeedbackSubmit = async (eventId: string) => {
    const form = feedbackForms[eventId];
    if (!form?.eventRating || !form?.instructorRating) {
      toast.error('Please rate both the event and the instructor');
      return;
    }

    try {
      await submitFeedbackRequest(eventId, {
        eventRating: Number(form.eventRating),
        instructorRating: Number(form.instructorRating),
        eventComment: form.eventComment || undefined,
        instructorComment: form.instructorComment || undefined,
      });
      setCompletedEvents((prev) => prev.map((event) => event.id === eventId ? { ...event, feedbackSubmitted: true } : event));
      toast.success('Feedback submitted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
      toast.error(message);
    }
  };

  const handleVolunteerToggle = async (eventId: string, eventTitle: string, isVolunteerRegistered: boolean) => {
    try {
      await volunteerRegistrationRequest(eventId, !isVolunteerRegistered);
      const refreshedEvents = await eventsRequest();
      setEvents(refreshedEvents);
      toast.success(isVolunteerRegistered ? `Removed volunteer interest for ${eventTitle}` : `Volunteer interest saved for ${eventTitle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update volunteer preference';
      toast.error(message);
    }
  };

  const completedModules = student?.modules.filter((m) => m.status === 'completed') ?? [];
  const pendingModules = student?.modules.filter((m) => m.status === 'pending') ?? [];
  const totalModules = student?.modules.length ?? 0;
  const progressPercent = totalModules > 0 ? Math.round((completedModules.length / totalModules) * 100) : 0;
  const eventDates = events.map((event) => event.date);
  const checkInReadyEvents = events.filter((event) => event.canCheckInNow && event.isRegistered);
  const calendarItems: CalendarEventItem[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    venue: event.venue,
    description: event.description,
    status: event.isRegistered ? 'registered' : 'available',
  }));

  const historyColumns = [
    {
      key: 'title',
      label: 'Module Name',
      sortable: true,
      render: (_: unknown, row: StudentModule) => <span className="font-medium text-white">{row.title}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: StudentModule) => (
        <Badge variant={row.status === 'completed' ? 'green' : row.status === 'pending' ? 'yellow' : 'purple'}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'completedDate',
      label: 'Date',
      sortable: true,
      render: (_: unknown, row: StudentModule) => (
        <span className="text-white/50 text-xs">
          {row.completedDate ? formatDate(row.completedDate) : row.scheduledDate ? formatDate(row.scheduledDate) : '-'}
        </span>
      ),
    },
    {
      key: 'marks',
      label: 'Score',
      render: (_: unknown, row: StudentModule) => row.marks !== undefined ? (
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${(row.marks ?? 0) >= 80 ? 'text-accent' : (row.marks ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {row.marks}/{row.maxMarks}
          </span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${(row.marks ?? 0) >= 80 ? 'bg-accent' : (row.marks ?? 0) >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${((row.marks ?? 0) / (row.maxMarks ?? 100)) * 100}%` }}
            />
          </div>
        </div>
      ) : <span className="text-white/30">-</span>,
    },
  ] as const;

  return (
    <DashboardLayout expectedRole="student">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()},{' '}
            <span className="gradient-text">{userName.split(' ')[0]}</span>!
          </h1>
          <p className="text-white/50 text-sm mt-1">
            You have <span className="text-accent font-semibold">{pendingModules.length} pending modules</span> and{' '}
            <span className="text-primary font-semibold">{events.length} upcoming events</span>
          </p>
        </div>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="text-6xl hidden md:block"
        >
          01
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Modules Done" value={completedModules.length} subtitle={`of ${totalModules} total`} icon={CheckCircle2} color="teal" index={0} />
            <StatCard title="Pending Modules" value={pendingModules.length} subtitle="to be completed" icon={Clock} color="yellow" index={1} />
            <StatCard title="Workshops Attended" value={student?.workshopsAttended ?? 0} subtitle="this semester" icon={Trophy} color="purple" index={2} />
            <StatCard title="Upcoming Events" value={events.length} subtitle="available" icon={Calendar} color="blue" index={3} />
          </>
        )}
      </div>

      {checkInReadyEvents.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-accent/20 bg-accent/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Check-In Open Today</h2>
              <p className="text-sm text-white/50 mt-1">
                You have {checkInReadyEvents.length} registered event{checkInReadyEvents.length > 1 ? 's' : ''} ready for check-in. Mark attendance from the event card below.
              </p>
            </div>
            <Badge variant="green">Action Needed</Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center"
        >
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-6">Course Progress</h2>
          <div className="w-36 h-36">
            <CircularProgressbar
              value={progressPercent}
              text={`${progressPercent}%`}
              styles={buildStyles({
                textColor: '#fff',
                textSize: '18px',
                pathColor: '#6C63FF',
                trailColor: 'rgba(255,255,255,0.08)',
                pathTransitionDuration: 1.5,
              })}
            />
          </div>
          <p className="mt-4 text-center text-sm text-white/60">
            <span className="text-white font-semibold">{completedModules.length}</span> of{' '}
            <span className="text-white font-semibold">{totalModules}</span> modules done
          </p>
          {student && (
            <div className="mt-4 w-full space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Attendance</span>
                <span className="text-accent font-semibold">{student.attendancePercentage}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${student.attendancePercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Programme</span>
                <Badge variant="purple">{student.programme}</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Department</span>
                <span className="text-white/60 text-right max-w-[60%] truncate">{student.department}</span>
              </div>
            </div>
          )}
        </motion.div>

        <div className="lg:col-span-2" id="modules">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" /> Completed Modules
            </h2>
            <Badge variant="green">{completedModules.length} done</Badge>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <ModuleCardSkeleton key={i} />)}
            </div>
          ) : completedModules.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">02</div>
              <p className="text-white/40 text-sm">No modules completed yet. Start your journey!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {completedModules.map((mod, i) => (
                <ModuleCard key={mod.id} module={mod} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {pendingModules.length > 0 && (
        <div id="schedule">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Pending Modules
            </h2>
            <Badge variant="yellow">{pendingModules.length} pending</Badge>
          </div>
          <div className="space-y-3">
            {pendingModules.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{mod.title}</p>
                  <p className="text-xs text-white/40">{mod.courseName}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {mod.scheduledDate && (
                    <Badge variant="ghost">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDate(mod.scheduledDate)}
                    </Badge>
                  )}
                  {mod.scheduledTime && (
                    <Badge variant="ghost">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(mod.scheduledTime)}
                    </Badge>
                  )}
                  {mod.venue && <Badge variant="blue">{mod.venue}</Badge>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div id="events">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Upcoming Events
          </h2>
          <Badge variant="blue">{events.length} events</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{event.description}</p>
                </div>
                <Badge variant={event.type === 'wellness' ? 'green' : event.type === 'workshop' ? 'purple' : 'blue'}>
                  {event.type}
                </Badge>
              </div>
              <div className="space-y-1.5 mb-4 text-xs text-white/50">
                <p>{formatDate(event.date)} - {formatTime(event.time)}</p>
                <p>{event.venue}</p>
                <p>{event.registeredCount}/{event.capacity} registered</p>
              </div>
              {!!event.sessions?.length && (
                <select
                  value={selectedSessions[event.id] ?? event.sessions[0]?.id ?? ''}
                  onChange={(e) => setSelectedSessions((prev) => ({ ...prev, [event.id]: e.target.value }))}
                  className="input-dark mb-3 w-full h-10 rounded-xl px-3 text-sm"
                >
                  {event.sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title} - {formatDate(session.date)} - {formatTime(session.time)}
                    </option>
                  ))}
                </select>
              )}
              {event.isRegistered ? (
                <div className="space-y-2">
                  <button
                    onClick={() => void handleRegister(event.id, event.title, true)}
                    className="w-full h-10 rounded-xl text-sm font-semibold border border-primary/30 bg-transparent text-primary hover:bg-primary/10 transition-all"
                  >
                    Registered
                  </button>
                  <button
                    onClick={() => void handleCheckIn(event.id, event.title)}
                    disabled={!event.canCheckInNow}
                    className={`w-full h-10 rounded-xl text-sm font-semibold transition-all ${
                      event.canCheckInNow
                        ? 'bg-gradient-to-r from-accent to-primary text-white'
                        : 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10'
                    }`}
                  >
                    {event.checkInStatus === 'attendance-marked'
                      ? 'Attendance Marked'
                      : event.checkInStatus === 'checked-in'
                        ? 'Checked In'
                        : 'Check In'}
                  </button>
                  <p className="text-[11px] text-white/40">
                    {event.canCheckInNow
                      ? 'Check-in is open for today.'
                      : `Check-in opens on the event day. Scheduled around ${event.checkInOpensLabel}.`}
                  </p>
                  {event.checkInTimeLabel && (
                    <p className="text-[11px] text-accent">Checked in at {event.checkInTimeLabel}</p>
                  )}
                  <button
                    onClick={() => void handleVolunteerToggle(event.id, event.title, Boolean(event.isVolunteerRegistered))}
                    className={`w-full h-10 rounded-xl text-sm font-semibold border transition-all ${
                      event.isVolunteerRegistered
                        ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/15'
                        : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {event.isVolunteerRegistered ? 'Volunteering for this Event' : 'Also Volunteer for this Event'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => void handleRegister(event.id, event.title, false)}
                    className="w-full h-10 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-primary to-primary-600 text-white"
                  >
                    Register
                  </button>
                  <button
                    onClick={() => void handleVolunteerToggle(event.id, event.title, Boolean(event.isVolunteerRegistered))}
                    className={`w-full h-10 rounded-xl text-sm font-semibold border transition-all ${
                      event.isVolunteerRegistered
                        ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/15'
                        : 'border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {event.isVolunteerRegistered ? 'Volunteering for this Event' : 'Volunteer Without Registering'}
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2" id="history">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Past Records
          </h2>
          <DataTable
            data={(student?.modules ?? []) as unknown as Record<string, unknown>[]}
            columns={historyColumns as any}
            searchable
            searchKeys={['title' as never]}
            emptyMessage="No module history yet"
            loading={loading}
          />
        </div>

        <div>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" /> My Calendar
          </h2>
          <MiniCalendar eventDates={eventDates} eventItems={calendarItems} />
        </div>
      </div>

      {completedEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Completed Events & Feedback</h2>
            <Badge variant="purple">{completedEvents.length} completed</Badge>
          </div>
          <div className="glass-card rounded-2xl p-5 border border-primary/10">
            <h3 className="text-sm font-semibold text-white">How was the experience?</h3>
            <p className="text-sm text-white/50 mt-1">Please share your valuable feedbacks with us.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedEvents.map((event) => (
              <div key={event.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{event.title}</h3>
                    <p className="text-xs text-white/40 mt-1">{event.date} - {event.time}</p>
                    <p className="text-[11px] text-white/30 mt-1">{event.sessionLabel || 'Main session'}</p>
                  </div>
                  <Badge variant={event.feedbackSubmitted ? 'green' : 'yellow'}>
                    {event.feedbackSubmitted ? 'Feedback Submitted' : 'Feedback Pending'}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-white/50">{event.venue}</p>
                {event.checkedInAtLabel && <p className="mt-2 text-[11px] text-accent">Checked in at {event.checkedInAtLabel}</p>}
                {!event.feedbackSubmitted && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={feedbackForms[event.id]?.eventRating ?? ''}
                        onChange={(e) => setFeedbackForms((prev) => ({ ...prev, [event.id]: { eventRating: e.target.value, instructorRating: prev[event.id]?.instructorRating ?? '', eventComment: prev[event.id]?.eventComment ?? '', instructorComment: prev[event.id]?.instructorComment ?? '' } }))}
                        className="input-dark h-10 rounded-xl px-3 text-sm"
                      >
                        <option value="">Rate event</option>
                        {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}
                      </select>
                      <select
                        value={feedbackForms[event.id]?.instructorRating ?? ''}
                        onChange={(e) => setFeedbackForms((prev) => ({ ...prev, [event.id]: { eventRating: prev[event.id]?.eventRating ?? '', instructorRating: e.target.value, eventComment: prev[event.id]?.eventComment ?? '', instructorComment: prev[event.id]?.instructorComment ?? '' } }))}
                        className="input-dark h-10 rounded-xl px-3 text-sm"
                      >
                        <option value="">Rate instructor</option>
                        {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}/5</option>)}
                      </select>
                    </div>
                    <textarea
                      value={feedbackForms[event.id]?.eventComment ?? ''}
                      onChange={(e) => setFeedbackForms((prev) => ({ ...prev, [event.id]: { eventRating: prev[event.id]?.eventRating ?? '', instructorRating: prev[event.id]?.instructorRating ?? '', eventComment: e.target.value, instructorComment: prev[event.id]?.instructorComment ?? '' } }))}
                      placeholder="How was the experience? Please share your valuable feedbacks with us."
                      className="input-dark w-full min-h-24 rounded-xl px-4 py-3 text-sm"
                    />
                    <textarea
                      value={feedbackForms[event.id]?.instructorComment ?? ''}
                      onChange={(e) => setFeedbackForms((prev) => ({ ...prev, [event.id]: { eventRating: prev[event.id]?.eventRating ?? '', instructorRating: prev[event.id]?.instructorRating ?? '', eventComment: prev[event.id]?.eventComment ?? '', instructorComment: e.target.value } }))}
                      placeholder="Share your feedback about the instructor."
                      className="input-dark w-full min-h-24 rounded-xl px-4 py-3 text-sm"
                    />
                    <button
                      onClick={() => void handleFeedbackSubmit(event.id)}
                      className="w-full h-10 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-accent text-white"
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
