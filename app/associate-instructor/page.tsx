'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, ClipboardList, Users, Search, Download, Play, CheckCircle2, XCircle, ToggleLeft, ToggleRight,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { attendanceRequest, availabilityRequest, dashboardRequest, eventsRequest, selfAssignRequest, sessionToggleRequest } from '@/lib/api';
import { getGreeting } from '@/lib/utils';
import { getStoredUser } from '@/lib/auth';
import type { AssociateDashboardData, AssociateRegistrant, FrontendEvent, QuizSession } from '@/types';
import toast from 'react-hot-toast';

type AttendanceStatus = 'present' | 'absent';

interface AttendanceEntry {
  studentId: string;
  name: string;
  rollNo: string;
  department: string;
  status: AttendanceStatus;
}

export default function AssociateInstructorDashboard() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [search, setSearch] = useState('');
  const [regSearch, setRegSearch] = useState('');
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const [registrants, setRegistrants] = useState<AssociateRegistrant[]>([]);
  const [currentSessionTitle, setCurrentSessionTitle] = useState('Current session');
  const [activeEvents, setActiveEvents] = useState<FrontendEvent[]>([]);

  useEffect(() => {
    const user = getStoredUser();
    setUserName(user?.name ?? 'Associate');

    const loadDashboard = async () => {
      try {
        const [data, eventData] = await Promise.all([dashboardRequest(), eventsRequest()]);
        const dashboard = data.dashboard as AssociateDashboardData;
        setAttendance(dashboard.attendance);
        setQuizSessions(dashboard.quizSessions);
        setRegistrants(dashboard.registrants);
        setCurrentSessionTitle(dashboard.currentSession?.title ?? 'Current session');
        setActiveEvents(eventData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load associate dashboard';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const refreshEvents = async () => setActiveEvents(await eventsRequest());

  const toggleAttendance = (studentId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.studentId === studentId
          ? { ...a, status: a.status === 'present' ? 'absent' : 'present' }
          : a
      )
    );
  };

  const toggleQuiz = async (sessionId: string, type: 'quiz' | 'feedback') => {
    try {
      const updated = await sessionToggleRequest(sessionId, type);
      setQuizSessions((prev) =>
        prev.map((session) => (session.sessionId === sessionId ? updated : session))
      );
      const action = type === 'quiz' ? updated.quizActive : updated.feedbackActive;
      toast.success(`${type === 'quiz' ? 'Quiz' : 'Feedback'} ${action ? 'activated' : 'deactivated'} for "${updated.sessionTitle}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update session state';
      toast.error(message);
    }
  };

  const handleSaveAttendance = async () => {
    if (!quizSessions.length) {
      toast.error('No session available for attendance');
      return;
    }

    try {
      const result = await attendanceRequest(quizSessions[0].sessionId, attendance);
      toast.success(`Attendance saved! ${result.present}/${result.saved} students marked present`);
      setRegistrants((prev) =>
        prev.map((registrant) => {
          const updatedEntry = attendance.find((entry) => entry.studentId === registrant.id);
          return updatedEntry ? { ...registrant, attendanceStatus: updatedEntry.status } : registrant;
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save attendance';
      toast.error(message);
    }
  };

  const filteredAttendance = attendance.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.rollNo.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase())
  );

  const filteredRegistrants = registrants.filter(
    (s) =>
      s.name.toLowerCase().includes(regSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(regSearch.toLowerCase()) ||
      s.department.toLowerCase().includes(regSearch.toLowerCase())
  );

  const handleExport = () => {
    const rows = [
      ['Name', 'Roll No.', 'Department', 'Programme', 'Year', 'Attendance'],
      ...filteredRegistrants.map((student) => {
        const att = attendance.find((a) => a.studentId === student.id);
        return [
          student.name,
          student.rollNo,
          student.department,
          student.programme,
          String(student.year),
          att?.status ?? 'N/A',
        ];
      }),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'registrants.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Registrant list exported as CSV');
  };

  const presentCount = attendance.filter((a) => a.status === 'present').length;

  const handleAvailability = async (eventId: string, isAvailable: boolean) => {
    try {
      await availabilityRequest(eventId, { isAvailable });
      await refreshEvents();
      toast.success(isAvailable ? 'Availability marked as available' : 'Availability marked as unavailable');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update availability';
      toast.error(message);
    }
  };

  const handleSelfAssign = async (eventId: string) => {
    try {
      await selfAssignRequest(eventId);
      await refreshEvents();
      toast.success('You are assigned to this event');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to self-assign';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout expectedRole="associate-instructor">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <h1 className="text-2xl font-bold text-white">
            {getGreeting()}, <span className="gradient-text">{userName.split(' ').slice(-1)[0]}</span>!
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Associate Instructor Panel - {currentSessionTitle}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Students" value={attendance.length} icon={Users} color="purple" index={0} />
            <StatCard title="Present Today" value={presentCount} icon={CheckCircle2} color="teal" index={1} />
            <StatCard title="Absent" value={attendance.length - presentCount} icon={XCircle} color="red" index={2} />
            <StatCard title="Quiz Sessions" value={quizSessions.length} icon={ClipboardList} color="yellow" index={3} />
          </>
        )}
      </div>

      <div id="attendance">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary" /> Mark Attendance
          </h2>
          <div className="flex items-center gap-3">
            <Badge variant="green">{presentCount} Present</Badge>
            <Badge variant="red">{attendance.length - presentCount} Absent</Badge>
            <Button variant="default" size="sm" onClick={() => void handleSaveAttendance()} className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Save Attendance
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, roll number, or department..."
                className="input-dark w-full pl-9 h-9 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredAttendance.length === 0 ? (
              <div className="p-12 text-center text-white/40 text-sm">No students found</div>
            ) : (
              filteredAttendance.map((student, i) => (
                <motion.div
                  key={student.studentId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${
                    student.status === 'present' ? 'hover:bg-accent/5' : 'hover:bg-red-500/5'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    student.status === 'present'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{student.name}</p>
                    <p className="text-xs text-white/40">{student.rollNo} - {student.department}</p>
                  </div>

                  <Badge variant={student.status === 'present' ? 'green' : 'red'}>
                    {student.status === 'present' ? 'Present' : 'Absent'}
                  </Badge>

                  <button
                    onClick={() => toggleAttendance(student.studentId)}
                    className="flex items-center gap-1 text-white/30 hover:text-white transition-colors ml-2"
                    title="Toggle attendance"
                  >
                    {student.status === 'present'
                      ? <ToggleRight className="w-7 h-7 text-accent" />
                      : <ToggleLeft className="w-7 h-7 text-red-400" />
                    }
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <div id="quizzes">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" /> Quiz & Feedback Activation
        </h2>

        <div className="space-y-3">
          {quizSessions.map((session, i) => (
            <motion.div
              key={session.sessionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{session.sessionTitle}</p>
                  <div className="flex gap-3 mt-2">
                    <span className={`text-xs flex items-center gap-1 ${session.quizActive ? 'text-accent' : 'text-white/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${session.quizActive ? 'bg-accent animate-pulse' : 'bg-white/20'}`} />
                      Quiz {session.quizActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${session.feedbackActive ? 'text-primary' : 'text-white/30'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${session.feedbackActive ? 'bg-primary animate-pulse' : 'bg-white/20'}`} />
                      Feedback {session.feedbackActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={session.quizActive ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => void toggleQuiz(session.sessionId, 'quiz')}
                    className="gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    {session.quizActive ? 'Deactivate Quiz' : 'Activate Quiz'}
                  </Button>
                  <Button
                    variant={session.feedbackActive ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => void toggleQuiz(session.sessionId, 'feedback')}
                    className="gap-1.5"
                  >
                    <ClipboardList className="w-3 h-3" />
                    {session.feedbackActive ? 'Deactivate Feedback' : 'Activate Feedback'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div id="registrants">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Registrants List
          </h2>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>

        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                placeholder="Search registrants..."
                className="input-dark w-full pl-9 h-9 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-dark">
              <thead>
                <tr>
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Roll No.</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-left">Programme</th>
                  <th className="px-5 py-3 text-left">Year</th>
                  <th className="px-5 py-3 text-left">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrants.map((student, i) => {
                  const att = attendance.find((a) => a.studentId === student.id);
                  return (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td className="px-5 py-3.5 text-xs text-white/30">{i + 1}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{student.name}</td>
                      <td className="px-5 py-3.5 text-xs text-white/50 font-mono">{student.rollNo}</td>
                      <td className="px-5 py-3.5 text-xs text-white/60">{student.department}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="purple">{student.programme}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/50">Year {student.year}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant={att?.status === 'present' ? 'green' : 'red'}>
                          {att?.status ?? 'N/A'}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-white/5 text-xs text-white/30">
            Showing {filteredRegistrants.length} of {registrants.length} registrants
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Availability & Assignment</h2>
          <Badge variant="green">{activeEvents.length} live events</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeEvents.map((event) => (
            <div key={event.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="text-xs text-white/40 mt-1">{event.date} - {event.time}</p>
                </div>
                <Badge variant="purple">{event.type}</Badge>
              </div>
              <p className="mt-3 text-sm text-white/50">{event.venue}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => void handleAvailability(event.id, true)}>Available</Button>
                <Button variant="secondary" size="sm" onClick={() => void handleAvailability(event.id, false)}>Not Available</Button>
              </div>
              <p className="mt-2 text-[11px] text-white/40">
                {event.myAvailability
                  ? `Availability updated on ${new Date(event.myAvailability.respondedAt).toLocaleString('en-IN')}`
                  : 'Share your availability with admin.'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                disabled={!event.canSelfAssign}
                onClick={() => void handleSelfAssign(event.id)}
              >
                {event.myAssignments?.includes('ASSOCIATE_INSTRUCTOR') ? 'Already Assigned' : event.canSelfAssign ? 'Self-Assign to Event' : 'Associate Slot Already Assigned'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
