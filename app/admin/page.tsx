'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Video, BookOpen, TrendingUp, Upload, Plus, ShieldCheck, Activity, Calendar, Download, ClipboardList,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatCardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import {
  adminAssignStaffRequest,
  adminCreateEventRequest,
  adminDownloadImportTemplateRequest,
  adminEventManagementRequest,
  adminEventRecordRequest,
  adminEventsCatalogRequest,
  adminExportUsersRequest,
  adminAttendanceUpdateRequest,
  adminExportEventRequest,
  adminImportJobsRequest,
  adminImportUploadRequest,
  adminUpdateUserRoleRequest,
  adminUsersFilteredRequest,
  dashboardRequest,
} from '@/lib/api';
import type {
  AdminAnalyticsData,
  AdminEventCatalogItem,
  AdminEventManagementData,
  AdminEventRecordData,
  AdminUserListItem,
  ImportJob,
} from '@/types';
import toast from 'react-hot-toast';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#6C63FF' }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

const ROLE_OPTIONS = ['STUDENT', 'INSTRUCTOR', 'ADMIN'] as const;
const EVENT_TYPE_OPTIONS = [
  { value: 'OPEN_WORKSHOP', label: 'Open Workshop' },
  { value: 'WELLNESS_COURSE', label: 'Wellness Course' },
  { value: 'PLACEMENT_WORKSHOP', label: 'Placement Workshop' },
  { value: 'PHD_WORKSHOP', label: 'PhD Workshop' },
  { value: 'OTHER', label: 'Other' },
] as const;
const IMPORT_TYPES = ['USERS', 'EVENT_REGISTRATIONS', 'EVENTS', 'MARKS', 'ATTENDANCE'] as const;
const EVENT_STATUS_OPTIONS = ['PUBLISHED', 'COMPLETED', 'DRAFT', 'CANCELLED'] as const;
const USER_FILTER_ROLES = ['ALL', 'STUDENT', 'INSTRUCTOR', 'ADMIN', 'VOLUNTEER'] as const;
const PROGRAMME_OPTIONS = ['ALL', 'BTECH', 'MTECH', 'PHD', 'MSC', 'MA', 'OTHER'] as const;

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [events, setEvents] = useState<AdminEventCatalogItem[]>([]);
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<(typeof USER_FILTER_ROLES)[number]>('ALL');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('');
  const [userProgrammeFilter, setUserProgrammeFilter] = useState<(typeof PROGRAMME_OPTIONS)[number]>('ALL');
  const [userYearFilter, setUserYearFilter] = useState('');
  const [userTotal, setUserTotal] = useState(0);
  const [eventStatusFilter, setEventStatusFilter] = useState<(typeof EVENT_STATUS_OPTIONS)[number]>('PUBLISHED');
  const [eventTypeFilter, setEventTypeFilter] = useState<'ALL' | (typeof EVENT_TYPE_OPTIONS)[number]['value']>('ALL');
  const [eventTotal, setEventTotal] = useState(0);

  const [importOpen, setImportOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [manageEventId, setManageEventId] = useState('');
  const [manageEventData, setManageEventData] = useState<AdminEventManagementData | null>(null);
  const [manageEventRecord, setManageEventRecord] = useState<AdminEventRecordData | null>(null);
  const [manageLoading, setManageLoading] = useState(false);
  const [assignRoleByUser, setAssignRoleByUser] = useState<Record<string, 'INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER'>>({});

  const [importType, setImportType] = useState<(typeof IMPORT_TYPES)[number]>('USERS');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]>('STUDENT');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    type: 'OPEN_WORKSHOP' as (typeof EVENT_TYPE_OPTIONS)[number]['value'],
    bannerImageUrl: '',
    venue: '',
    meetLink: '',
    startAt: '',
    endAt: '',
    registrationOpensAt: '',
    registrationClosesAt: '',
    capacity: '',
    volunteersNeeded: '',
    allowVolunteerSignup: true,
    requiresCheckIn: true,
  });

  useEffect(() => {
    const boot = async () => {
      try {
        const [dashboard, userData, eventData, jobData] = await Promise.all([
          dashboardRequest(),
          adminUsersFilteredRequest({ limit: 100 }),
          adminEventsCatalogRequest({ status: 'PUBLISHED' }),
          adminImportJobsRequest(),
        ]);

        setData(dashboard.analytics ?? null);
        setUsers(userData.items);
        setUserTotal(userData.total);
        setEvents(eventData.items);
        setEventTotal(eventData.total);
        setImportJobs(jobData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load admin dashboard';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void boot();
  }, []);

  useEffect(() => {
    if (loading) return;

    const timeout = setTimeout(() => {
      void adminUsersFilteredRequest({
        search: userSearch || undefined,
        role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
        department: userDepartmentFilter || undefined,
        programme: userProgrammeFilter === 'ALL' ? undefined : userProgrammeFilter,
        yearOfStudy: userYearFilter ? Number(userYearFilter) : undefined,
        limit: 100,
      })
        .then((response) => {
          setUsers(response.items);
          setUserTotal(response.total);
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to search users';
          toast.error(message);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [loading, userDepartmentFilter, userProgrammeFilter, userRoleFilter, userSearch, userYearFilter]);

  useEffect(() => {
    if (loading) return;

    void adminEventsCatalogRequest({
      status: eventStatusFilter,
      type: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
    })
      .then((response) => {
        setEvents(response.items);
        setEventTotal(response.total);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load events';
        toast.error(message);
      });
  }, [eventStatusFilter, eventTypeFilter, loading]);

  const activityIcon = (icon: string) => {
    if (icon === 'done') return 'OK';
    if (icon === 'list') return 'IN';
    return '--';
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please choose a file first');
      return;
    }

    try {
      await adminImportUploadRequest(importType, importFile);
      toast.success('Import uploaded successfully');
      setImportOpen(false);
      setImportFile(null);
      setImportJobs(await adminImportJobsRequest());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload import';
      toast.error(message);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title || !eventForm.description || !eventForm.startAt || !eventForm.endAt) {
      toast.error('Please fill the required event fields');
      return;
    }

    try {
      await adminCreateEventRequest({
        title: eventForm.title,
        description: eventForm.description,
        type: eventForm.type,
        bannerImageUrl: eventForm.bannerImageUrl || undefined,
        venue: eventForm.venue || undefined,
        meetLink: eventForm.meetLink || undefined,
        startAt: new Date(eventForm.startAt).toISOString(),
        endAt: new Date(eventForm.endAt).toISOString(),
        registrationOpensAt: eventForm.registrationOpensAt ? new Date(eventForm.registrationOpensAt).toISOString() : undefined,
        registrationClosesAt: eventForm.registrationClosesAt ? new Date(eventForm.registrationClosesAt).toISOString() : undefined,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : undefined,
        volunteersNeeded: eventForm.volunteersNeeded ? Number(eventForm.volunteersNeeded) : undefined,
        allowVolunteerSignup: eventForm.allowVolunteerSignup,
        requiresCheckIn: eventForm.requiresCheckIn,
        status: 'PUBLISHED',
      });
      toast.success('Event created successfully');
      setEventOpen(false);
      setEventForm({
        title: '',
        description: '',
        type: 'OPEN_WORKSHOP',
        bannerImageUrl: '',
        venue: '',
        meetLink: '',
        startAt: '',
        endAt: '',
        registrationOpensAt: '',
        registrationClosesAt: '',
        capacity: '',
        volunteersNeeded: '',
        allowVolunteerSignup: true,
        requiresCheckIn: true,
      });
      const response = await adminEventsCatalogRequest({
        status: eventStatusFilter,
        type: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
      });
      setEvents(response.items);
      setEventTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      toast.error(message);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    try {
      await adminUpdateUserRoleRequest(selectedUserId, selectedRole);
      toast.success('Role updated successfully');
      setRoleOpen(false);
      const response = await adminUsersFilteredRequest({
        search: userSearch || undefined,
        role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
        department: userDepartmentFilter || undefined,
        programme: userProgrammeFilter === 'ALL' ? undefined : userProgrammeFilter,
        yearOfStudy: userYearFilter ? Number(userYearFilter) : undefined,
        limit: 100,
      });
      setUsers(response.items);
      setUserTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(message);
    }
  };

  const openManageEvent = async (eventId: string) => {
    try {
      setManageLoading(true);
      setManageEventId(eventId);
      const [data, record] = await Promise.all([
        adminEventManagementRequest(eventId),
        adminEventRecordRequest(eventId),
      ]);
      setManageEventData(data);
      setManageEventRecord(record);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load event details';
      toast.error(message);
      setManageEventId('');
      setManageEventRecord(null);
    } finally {
      setManageLoading(false);
    }
  };

  const handleAttendanceUpdate = async (userId: string, status: 'present' | 'absent' | 'excused', moduleId?: string) => {
    if (!manageEventId) return;
    try {
      await adminAttendanceUpdateRequest(manageEventId, { userId, moduleId, status });
      const [data, record] = await Promise.all([
        adminEventManagementRequest(manageEventId),
        adminEventRecordRequest(manageEventId),
      ]);
      setManageEventData(data);
      setManageEventRecord(record);
      toast.success('Attendance updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update attendance';
      toast.error(message);
    }
  };

  const handleAssignStaff = async (userId: string) => {
    if (!manageEventId) return;
    const role = assignRoleByUser[userId] ?? 'VOLUNTEER';
    try {
      await adminAssignStaffRequest(manageEventId, { userId, role });
      const [data, record] = await Promise.all([
        adminEventManagementRequest(manageEventId),
        adminEventRecordRequest(manageEventId),
      ]);
      setManageEventData(data);
      setManageEventRecord(record);
      toast.success('Staff assigned successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign staff';
      toast.error(message);
    }
  };

  return (
    <DashboardLayout expectedRole="admin">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-white/50 text-sm">Admin Control Panel</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">
              Flourishing Hub <span className="gradient-text">Analytics</span>
            </h1>
            <p className="text-white/40 text-sm mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="green">Live Data</Badge>
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard title="Total Students" value={(data?.totalStudents ?? 0).toLocaleString()} trend={{ value: 12, label: 'vs last sem' }} icon={Users} color="purple" index={0} />
            <StatCard title="Total Workshops" value={data?.totalWorkshops ?? 0} trend={{ value: 8, label: 'vs last sem' }} icon={Video} color="teal" index={1} />
            <StatCard title="Active Courses" value={data?.activeCourses ?? 0} icon={BookOpen} color="yellow" index={2} />
            <StatCard title="Engagement Rate" value={`${data?.engagementRate ?? 0}%`} trend={{ value: 5, label: 'vs last sem' }} icon={TrendingUp} color="blue" index={3} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6" id="analytics">
          {loading ? <ChartSkeleton /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Workshops Conducted</h3>
                  <p className="text-xs text-white/40 mt-0.5">Monthly trend</p>
                </div>
                <Badge variant="purple">This Year</Badge>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data?.workshopsPerMonth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="workshops" stroke="#6C63FF" strokeWidth={2.5} dot={{ fill: '#6C63FF', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#00C9A7' }} name="Workshops" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {loading ? <ChartSkeleton /> : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-white">Student Engagement by Department</h3>
                  <p className="text-xs text-white/40 mt-0.5">Engagement % and student count</p>
                </div>
                <Badge variant="green">Current Sem</Badge>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.engagementByDept ?? []} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="dept" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
                  <Bar dataKey="students" fill="#6C63FF" radius={[4, 4, 0, 0]} name="Students" />
                  <Bar dataKey="engagement" fill="#00C9A7" radius={[4, 4, 0, 0]} name="Engagement %" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? <ChartSkeleton /> : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-6">Programme Distribution</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={data?.programmeDistribution ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                      {(data?.programmeDistribution ?? []).map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {loading ? <ChartSkeleton /> : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Attendance Heatmap</h3>
                <p className="text-xs text-white/40 mb-4">Session activity over last 12 weeks</p>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
                  {(data?.attendanceHeatmap?.[0] ?? []).map((_, col) => (
                    <div key={col} className="flex flex-col gap-1">
                      {(data?.attendanceHeatmap ?? []).map((row, rowIdx) => {
                        const count = row[col]?.count ?? 0;
                        const opacity = count > 40 ? 1 : count > 25 ? 0.7 : count > 10 ? 0.4 : 0.1;
                        return <div key={rowIdx} className="w-full aspect-square rounded-sm" style={{ background: `rgba(108, 99, 255, ${opacity})` }} title={`${count} sessions`} />;
                      })}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="default" className="w-full justify-start gap-2.5" onClick={() => setImportOpen(true)}>
                <Upload className="w-4 h-4" /> Import Excel Data
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2.5" onClick={() => setEventOpen(true)}>
                <Plus className="w-4 h-4" /> Add New Event
              </Button>
              <Button variant="secondary" className="w-full justify-start gap-2.5" onClick={() => setRoleOpen(true)}>
                <ShieldCheck className="w-4 h-4" /> Assign Role
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
              {(data?.recentActivity ?? []).map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                  <span className="text-xs mt-0.5 shrink-0">{activityIcon(item.icon)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/70 leading-snug">{item.action}</p>
                    <p className="text-[10px] text-white/30 mt-1">{new Date(item.time).toLocaleString('en-IN')}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div id="students" className="glass-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Students & Members
              </h3>
              <p className="mt-1 text-xs text-white/40">
                Live filtering by role, department, programme, and year. {userTotal} member{userTotal !== 1 ? 's' : ''} matched.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => void adminExportUsersRequest({
                search: userSearch || undefined,
                role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
                department: userDepartmentFilter || undefined,
                programme: userProgrammeFilter === 'ALL' ? undefined : userProgrammeFilter,
                yearOfStudy: userYearFilter ? Number(userYearFilter) : undefined,
              }, 'csv')}>
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={() => void adminExportUsersRequest({
                search: userSearch || undefined,
                role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
                department: userDepartmentFilter || undefined,
                programme: userProgrammeFilter === 'ALL' ? undefined : userProgrammeFilter,
                yearOfStudy: userYearFilter ? Number(userYearFilter) : undefined,
              }, 'xlsx')}>
                <Download className="w-3.5 h-3.5" /> XLSX
              </Button>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <Input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name, email, roll..." />
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value as (typeof USER_FILTER_ROLES)[number])} className="input-dark h-11 rounded-xl px-4 text-sm">
              {USER_FILTER_ROLES.map((role) => <option key={role} value={role}>{role === 'ALL' ? 'All roles' : role}</option>)}
            </select>
            <Input value={userDepartmentFilter} onChange={(e) => setUserDepartmentFilter(e.target.value)} placeholder="Department" />
            <select value={userProgrammeFilter} onChange={(e) => setUserProgrammeFilter(e.target.value as (typeof PROGRAMME_OPTIONS)[number])} className="input-dark h-11 rounded-xl px-4 text-sm">
              {PROGRAMME_OPTIONS.map((programme) => <option key={programme} value={programme}>{programme === 'ALL' ? 'All programmes' : programme}</option>)}
            </select>
            <Input value={userYearFilter} onChange={(e) => setUserYearFilter(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Year" />
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-white/5 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{user.name}</p>
                  <p className="text-xs text-white/40">{user.email}</p>
                  <p className="text-[11px] text-white/30 mt-1">
                    {user.studentProfile?.department || user.instructorProfile?.department || 'General'} - {user.role}
                  </p>
                  {user.studentProfile && (
                    <p className="text-[11px] text-white/25 mt-1">
                      {user.studentProfile.programme || 'Programme'} - Year {user.studentProfile.yearOfStudy || '-'}
                    </p>
                  )}
                </div>
                <Badge variant="purple">{user.role}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div id="events" className="glass-card rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" /> Events
              </h3>
              <p className="mt-1 text-xs text-white/40">
                Live event list with status and type filters. {eventTotal} event{eventTotal !== 1 ? 's' : ''} matched.
              </p>
            </div>
            <Badge variant={eventStatusFilter === 'COMPLETED' ? 'purple' : 'green'}>{eventStatusFilter}</Badge>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={eventStatusFilter} onChange={(e) => setEventStatusFilter(e.target.value as (typeof EVENT_STATUS_OPTIONS)[number])} className="input-dark h-11 rounded-xl px-4 text-sm">
              {EVENT_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select value={eventTypeFilter} onChange={(e) => setEventTypeFilter(e.target.value as 'ALL' | (typeof EVENT_TYPE_OPTIONS)[number]['value'])} className="input-dark h-11 rounded-xl px-4 text-sm">
              <option value="ALL">All event types</option>
              {EVENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar">
            {events.map((event) => (
              <div key={event.id} className="rounded-xl border border-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <Badge variant={event.status === 'COMPLETED' ? 'purple' : 'blue'}>{event.type}</Badge>
                </div>
                <p className="text-xs text-white/40 mt-1">{event.description}</p>
                <p className="text-[11px] text-white/30 mt-2">
                  {new Date(event.startAt).toLocaleDateString('en-IN')} - {new Date(event.startAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} - {event.venue || 'TBA'}
                </p>
                <p className="text-[11px] text-white/25 mt-1">
                  {event._count?.registrations ?? 0} registrants - {event._count?.attendances ?? 0} attendance records
                </p>
                <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => void openManageEvent(event.id)}>
                  <ClipboardList className="w-3.5 h-3.5" /> {event.status === 'COMPLETED' ? 'View Event Record' : 'Manage Event'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div id="workshops" className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Workshops</h3>
          <p className="text-sm text-white/60">{data?.totalWorkshops ?? 0} workshops currently represented in analytics.</p>
        </div>
        <div id="courses" className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" /> Courses</h3>
          <p className="text-sm text-white/60">{data?.activeCourses ?? 0} active courses currently represented in analytics.</p>
        </div>
        <div id="roles" className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Roles</h3>
          <p className="text-sm text-white/60">Use the role assignment action to update member roles against the live backend.</p>
        </div>
      </div>

      <div id="settings" className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Import Jobs</h3>
        <div className="space-y-2">
          {importJobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-white/5 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{job.fileName}</p>
                <p className="text-xs text-white/40">{job.type}</p>
              </div>
              <Badge variant={job.status === 'COMPLETED' ? 'green' : job.status === 'FAILED' ? 'red' : 'yellow'}>
                {job.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
            <DialogDescription>Upload a CSV or XLSX file to the backend import pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <select value={importType} onChange={(e) => setImportType(e.target.value as (typeof IMPORT_TYPES)[number])} className="input-dark w-full h-11 rounded-xl px-4 text-sm">
              {IMPORT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <Button variant="outline" className="w-full" onClick={() => void adminDownloadImportTemplateRequest(importType)}>
              Download {importType} Template
            </Button>
            <input type="file" accept=".csv,.xlsx" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="input-dark w-full h-11 rounded-xl px-4 text-sm pt-2" />
            <p className="text-xs text-white/40">
              Schedule-style workbooks like your shared workshop sheet should be uploaded as <span className="text-white/70 font-semibold">EVENTS</span>.
            </p>
            <Button className="w-full" onClick={() => void handleImport()}>Upload Import</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Create a new event with production fields that map directly to the backend schema.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={eventForm.title} onChange={(e) => setEventForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Title" />
            <textarea value={eventForm.description} onChange={(e) => setEventForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Description" className="input-dark w-full min-h-28 rounded-xl px-4 py-3 text-sm" />
            <select value={eventForm.type} onChange={(e) => setEventForm((prev) => ({ ...prev, type: e.target.value as (typeof EVENT_TYPE_OPTIONS)[number]['value'] }))} className="input-dark w-full h-11 rounded-xl px-4 text-sm">
              {EVENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <Input value={eventForm.bannerImageUrl} onChange={(e) => setEventForm((prev) => ({ ...prev, bannerImageUrl: e.target.value }))} placeholder="Banner image URL (optional)" />
            <Input value={eventForm.venue} onChange={(e) => setEventForm((prev) => ({ ...prev, venue: e.target.value }))} placeholder="Venue" />
            <Input value={eventForm.meetLink} onChange={(e) => setEventForm((prev) => ({ ...prev, meetLink: e.target.value }))} placeholder="Online meeting link (optional)" />
            <div className="grid grid-cols-2 gap-3">
              <Input type="datetime-local" value={eventForm.startAt} onChange={(e) => setEventForm((prev) => ({ ...prev, startAt: e.target.value }))} />
              <Input type="datetime-local" value={eventForm.endAt} onChange={(e) => setEventForm((prev) => ({ ...prev, endAt: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="datetime-local" value={eventForm.registrationOpensAt} onChange={(e) => setEventForm((prev) => ({ ...prev, registrationOpensAt: e.target.value }))} />
              <Input type="datetime-local" value={eventForm.registrationClosesAt} onChange={(e) => setEventForm((prev) => ({ ...prev, registrationClosesAt: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" value={eventForm.capacity} onChange={(e) => setEventForm((prev) => ({ ...prev, capacity: e.target.value }))} placeholder="Capacity" />
              <Input type="number" value={eventForm.volunteersNeeded} onChange={(e) => setEventForm((prev) => ({ ...prev, volunteersNeeded: e.target.value }))} placeholder="Volunteer slots" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                <span>Allow volunteer signup</span>
                <input type="checkbox" checked={eventForm.allowVolunteerSignup} onChange={(e) => setEventForm((prev) => ({ ...prev, allowVolunteerSignup: e.target.checked }))} />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                <span>Require check-in</span>
                <input type="checkbox" checked={eventForm.requiresCheckIn} onChange={(e) => setEventForm((prev) => ({ ...prev, requiresCheckIn: e.target.checked }))} />
              </label>
            </div>
            <Button className="w-full" onClick={() => void handleCreateEvent()}>Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>Change a user role directly in the backend. Volunteer support remains event-based, not a separate portal role to assign broadly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="input-dark w-full h-11 rounded-xl px-4 text-sm">
              <option value="">Select a user</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} - {user.email}</option>)}
            </select>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as (typeof ROLE_OPTIONS)[number])} className="input-dark w-full h-11 rounded-xl px-4 text-sm">
              {ROLE_OPTIONS.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <Button className="w-full" onClick={() => void handleRoleUpdate()}>Update Role</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageEventId} onOpenChange={(open) => { if (!open) { setManageEventId(''); setManageEventData(null); setManageEventRecord(null); } }}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{manageEventData?.event.title ?? 'Manage Event'}</DialogTitle>
            <DialogDescription>
              View registrations, check-ins, attendance, availability, and staff assignments for this event.
            </DialogDescription>
          </DialogHeader>
          {manageLoading ? (
            <div className="py-16 text-center text-white/40">Loading event details...</div>
          ) : manageEventData && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-white/60">
                  {manageEventData.event.date} - {manageEventData.event.time} - {manageEventData.event.venue}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => void adminExportEventRequest(manageEventData.event.id, 'csv')}>
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => void adminExportEventRequest(manageEventData.event.id, 'xlsx')}>
                    <Download className="w-3.5 h-3.5" /> Export XLSX
                  </Button>
                </div>
              </div>

              {manageEventRecord && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/35">Registrants</p>
                    <p className="mt-2 text-2xl font-bold text-white">{manageEventRecord.summary.totalRegistrants}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/35">Attended</p>
                    <p className="mt-2 text-2xl font-bold text-white">{manageEventRecord.summary.totalAttended}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/35">Avg Event Rating</p>
                    <p className="mt-2 text-2xl font-bold text-white">{manageEventRecord.summary.avgEventRating?.toFixed(1) ?? '-'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <p className="text-xs text-white/35">Avg Instructor Rating</p>
                    <p className="mt-2 text-2xl font-bold text-white">{manageEventRecord.summary.avgInstructorRating?.toFixed(1) ?? '-'}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="glass-card rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Registered Students</h3>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar">
                    {manageEventData.roster.map((row) => (
                      <div key={row.registrationId} className="rounded-xl border border-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{row.name}</p>
                            <p className="text-xs text-white/40">{row.email}</p>
                            <p className="text-[11px] text-white/30 mt-1">
                              {row.rollNumber || 'No roll number'} - {row.sessionLabel || 'Main session'}
                            </p>
                          </div>
                          <Badge variant={row.checkInStatus === 'checked-in' ? 'green' : 'yellow'}>
                            {row.checkInStatus === 'checked-in' ? 'Checked In' : 'Not Checked In'}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="rounded-xl bg-white/5 p-3 text-white/60">
                            <p className="text-white/30 mb-1">Registration</p>
                            {row.registrationStatus}
                          </div>
                          <div className="rounded-xl bg-white/5 p-3 text-white/60">
                            <p className="text-white/30 mb-1">Check-In Time</p>
                            {row.checkedInAtLabel || 'Not checked in yet'}
                          </div>
                          <div className="rounded-xl bg-white/5 p-3">
                            <p className="text-white/30 mb-1">Attendance</p>
                            <select
                              value={row.attendanceStatus === 'not-marked' ? 'absent' : row.attendanceStatus}
                              onChange={(e) => void handleAttendanceUpdate(row.userId, e.target.value as 'present' | 'absent' | 'excused', row.sessionId || undefined)}
                              className="input-dark w-full h-9 rounded-lg px-2 text-xs"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                              <option value="excused">Excused</option>
                            </select>
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] text-white/40">
                          Self check-in is counted automatically. If needed, you can still correct the final attendance from the selector above.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Availability</h3>
                    <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                      {manageEventData.availability.map((item) => (
                        <div key={item.userId} className="rounded-xl border border-white/5 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{item.name}</p>
                              <p className="text-xs text-white/40">{item.email}</p>
                              <p className="text-[11px] text-white/30 mt-1">{item.role} - {item.respondedAtLabel}</p>
                            </div>
                            <Badge variant={item.isAvailable ? 'green' : 'red'}>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </div>
                          {item.isAvailable && (
                            <div className="mt-3 flex gap-2">
                              <select
                                value={assignRoleByUser[item.userId] ?? (item.role === 'volunteer' ? 'VOLUNTEER' : item.role === 'associate-instructor' ? 'ASSOCIATE_INSTRUCTOR' : 'INSTRUCTOR')}
                                onChange={(e) => setAssignRoleByUser((prev) => ({ ...prev, [item.userId]: e.target.value as 'INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER' }))}
                                className="input-dark flex-1 h-9 rounded-lg px-2 text-xs"
                              >
                                <option value="INSTRUCTOR">Instructor</option>
                                <option value="ASSOCIATE_INSTRUCTOR">Associate Instructor</option>
                                <option value="VOLUNTEER">Volunteer</option>
                              </select>
                              <Button size="sm" onClick={() => void handleAssignStaff(item.userId)}>Assign</Button>
                            </div>
                          )}
                          {item.note && <p className="mt-2 text-[11px] text-white/40">{item.note}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Assigned Staff</h3>
                    <div className="space-y-2">
                      {manageEventData.assignments.map((assignment) => (
                        <div key={assignment.id} className="rounded-xl border border-white/5 p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{assignment.name}</p>
                            <p className="text-xs text-white/40">{assignment.email}</p>
                          </div>
                          <Badge variant="purple">{assignment.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {manageEventRecord && (
                    <div className="glass-card rounded-2xl p-4">
                      <h3 className="text-sm font-semibold text-white mb-3">Participant Feedback Snapshot</h3>
                      <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                        {manageEventRecord.roster
                          .filter((entry) => entry.eventComment || entry.instructorComment || entry.eventRating || entry.instructorRating)
                          .slice(0, 8)
                          .map((entry) => (
                            <div key={entry.registrationId} className="rounded-xl border border-white/5 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-white">{entry.name}</p>
                                <div className="text-[11px] text-white/35">
                                  Event {entry.eventRating ?? '-'} / Instructor {entry.instructorRating ?? '-'}
                                </div>
                              </div>
                              {entry.eventComment && <p className="mt-2 text-xs text-white/55">{entry.eventComment}</p>}
                              {entry.instructorComment && <p className="mt-2 text-xs text-white/40">{entry.instructorComment}</p>}
                            </div>
                          ))}
                        {manageEventRecord.roster.every((entry) => !entry.eventComment && !entry.instructorComment && !entry.eventRating && !entry.instructorRating) && (
                          <p className="text-sm text-white/40">No feedback has been submitted for this event yet.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
