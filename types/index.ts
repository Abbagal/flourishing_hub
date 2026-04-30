export type UserRole = 'student' | 'instructor' | 'admin' | 'volunteer' | 'associate-instructor';
export type Programme = 'BTech' | 'MTech' | 'PhD' | 'MSc' | 'MA' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
}

export interface Student extends User {
  role: 'student';
  rollNo: string;
  department: string;
  year: number;
  programme: 'BTech' | 'MTech' | 'PhD' | 'MSc';
  enrolledCourses: string[];
  modules: StudentModule[];
  attendancePercentage: number;
  workshopsAttended: number;
  upcomingEvents: string[];
}

export interface StudentModule {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  status: 'completed' | 'pending' | 'in-progress';
  marks?: number;
  maxMarks?: number;
  completedDate?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  venue?: string;
  duration: number;
}

export interface Instructor extends User {
  role: 'instructor';
  specialization: string;
  sessions: Session[];
  totalStudents: number;
}

export interface AssociateInstructor extends User {
  role: 'associate-instructor';
  assignedSessions: string[];
}

export interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

export interface Volunteer extends User {
  role: 'volunteer';
  rollNo: string;
  department: string;
  year: number;
  programme: 'BTech' | 'MTech' | 'PhD' | 'MSc';
  volunteeringEvents: VolunteerEvent[];
  modules: StudentModule[];
  attendancePercentage: number;
  workshopsAttended: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  totalModules: number;
  completedModules: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  thumbnail?: string;
  tags: string[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number;
  type: 'lecture' | 'workshop' | 'quiz' | 'assignment';
  scheduledDate?: string;
  scheduledTime?: string;
  venue?: string;
  meetLink?: string;
  status: 'completed' | 'pending' | 'active';
  maxMarks?: number;
}

export interface Session {
  id: string;
  title: string;
  instructorId: string;
  instructorName: string;
  date: string;
  time: string;
  venue: string;
  meetLink?: string;
  participantCount: number;
  actualAttendees?: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  type: 'workshop' | 'seminar' | 'therapy' | 'group-session';
  registrants: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  type: 'workshop' | 'wellness' | 'seminar' | 'social' | 'volunteer';
  organizer: string;
  capacity: number;
  registeredCount: number;
  tags: string[];
  isRecurring: boolean;
  volunteerSlots?: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  markedBy?: string;
}

export interface VolunteerEvent {
  eventId: string;
  eventTitle: string;
  date: string;
  status: 'registered' | 'completed' | 'pending';
  hoursContributed?: number;
}

export interface AnalyticsData {
  workshopsPerMonth: { month: string; workshops: number }[];
  engagementByDept: { dept: string; students: number; engagement: number }[];
  programmeDistribution: { name: string; value: number; color: string }[];
  attendanceHeatmap: { date: string; count: number }[][];
  totalStudents: number;
  totalWorkshops: number;
  activeCourses: number;
  engagementRate: number;
}

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  rollNo?: string;
  empId?: string;
  department?: string;
  year?: number;
  batch?: string;
  programme?: Programme;
  iat: number;
  exp?: number;
}

export interface Notification {
  id: string;
  type: 'reminder' | 'general';
  message: string;
  time: string;
  read: boolean;
}

export interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue?: string;
  status?: 'registered' | 'available' | 'scheduled';
  description?: string;
}

export interface QuizSession {
  sessionId: string;
  sessionTitle: string;
  quizActive: boolean;
  feedbackActive: boolean;
  quizLink?: string;
  feedbackLink?: string;
}

export interface FrontendEvent extends Event {
  isRegistered?: boolean;
  isVolunteerRegistered?: boolean;
  selectedSessionId?: string | null;
  selectedSessionLabel?: string | null;
  sessions?: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
  }[];
  checkInStatus?: 'not-checked-in' | 'checked-in' | 'attendance-marked';
  checkInTime?: string | null;
  checkInTimeLabel?: string | null;
  canCheckInNow?: boolean;
  checkInOpensLabel?: string | null;
  myAvailability?: {
    isAvailable: boolean;
    note?: string | null;
    respondedAt: string;
  } | null;
  myAssignments?: ('INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER')[];
  canSelfAssign?: boolean;
}

export interface StudentCompletedEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  sessionId?: string | null;
  sessionLabel?: string | null;
  checkedInAtLabel?: string | null;
  feedbackSubmitted: boolean;
}

export interface RecentActivityItem {
  id: string | number;
  action: string;
  time: string;
  type: string;
  icon: string;
}

export interface AdminAnalyticsData extends AnalyticsData {
  recentActivity: RecentActivityItem[];
}

export interface VolunteerStats {
  eventsCompleted: number;
  hoursContributed: number;
}

export interface VolunteerDashboardData extends Omit<Student, 'role'> {
  role: 'volunteer';
  events: FrontendEvent[];
  registrations: {
    id: string;
    eventId: string;
    status: string;
    isVolunteer: boolean;
    registeredAt: string;
  }[];
  volunteeringStats: VolunteerStats;
}

export type InstructorDashboardData = Instructor;

export interface AssociateAttendanceEntry {
  studentId: string;
  name: string;
  rollNo: string;
  department: string;
  status: 'present' | 'absent';
}

export interface AssociateRegistrant {
  id: string;
  name: string;
  email: string;
  role: 'student';
  rollNo: string;
  department: string;
  year: number;
  programme: 'BTech' | 'MTech' | 'PhD' | 'MSc' | 'MA' | 'Other';
  attendanceStatus: 'present' | 'absent';
}

export interface AssociateDashboardData {
  instructor: InstructorDashboardData;
  currentSession: Session | null;
  attendance: AssociateAttendanceEntry[];
  registrants: AssociateRegistrant[];
  quizSessions: QuizSession[];
}

export interface FrontendLoginResponse {
  token: string;
  accessToken: string;
  refreshToken?: string;
  user: AuthPayload;
}

export interface FrontendDashboardResponse {
  role: UserRole;
  dashboard?: (Student & { completedEvents?: StudentCompletedEvent[] }) | VolunteerDashboardData | InstructorDashboardData | AssociateDashboardData;
  analytics?: AdminAnalyticsData;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'VOLUNTEER';
  studentProfile?: {
    rollNumber?: string;
    department?: string;
    yearOfStudy?: number;
    programme?: 'BTECH' | 'MTECH' | 'PHD' | 'MSC' | 'MA' | 'OTHER';
  } | null;
  instructorProfile?: {
    department?: string;
    designation?: string;
  } | null;
  stats: {
    totalRegistrations: number;
    totalAssignments: number;
  };
}

export interface AdminUsersResponse {
  items: AdminUserListItem[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminUserFilters {
  search?: string;
  role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'VOLUNTEER';
  department?: string;
  programme?: 'BTECH' | 'MTECH' | 'PHD' | 'MSC' | 'MA' | 'OTHER';
  yearOfStudy?: number;
  cohort?: string;
  page?: number;
  limit?: number;
}

export interface ImportJob {
  id: string;
  type: 'USERS' | 'EVENT_REGISTRATIONS' | 'EVENTS' | 'MARKS' | 'ATTENDANCE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventRosterItem {
  registrationId: string;
  userId: string;
  name: string;
  email: string;
  rollNumber?: string | null;
  department?: string | null;
  programme?: string | null;
  yearOfStudy?: number | null;
  registrationStatus: string;
  sessionId?: string | null;
  sessionLabel?: string | null;
  checkInId?: string | null;
  checkedInAt?: string | null;
  checkedInAtLabel?: string | null;
  checkInStatus: 'not-checked-in' | 'checked-in';
  checkInReviewStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  attendanceStatus: 'present' | 'absent' | 'excused' | 'not-marked';
}

export interface AdminAvailabilityItem {
  userId: string;
  name: string;
  email: string;
  role: 'instructor' | 'associate-instructor' | 'volunteer';
  department?: string | null;
  designation?: string | null;
  isAvailable: boolean;
  note?: string | null;
  respondedAt: string;
  respondedAtLabel: string;
  assignedRoles: ('INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER')[];
}

export interface AdminAssignmentItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER';
  notes?: string | null;
}

export interface AdminEventManagementData {
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    type: string;
    modules: {
      id: string;
      title: string;
      date: string;
      time: string;
      venue: string;
    }[];
  };
  roster: AdminEventRosterItem[];
  availability: AdminAvailabilityItem[];
  assignments: AdminAssignmentItem[];
}

export interface AdminEventCatalogItem {
  id: string;
  title: string;
  description: string;
  type: 'OPEN_WORKSHOP' | 'WELLNESS_COURSE' | 'PLACEMENT_WORKSHOP' | 'PHD_WORKSHOP' | 'OTHER';
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  venue?: string | null;
  startAt: string;
  endAt: string;
  capacity?: number | null;
  volunteersNeeded?: number | null;
  _count?: {
    registrations: number;
    attendances: number;
    availabilityResponses: number;
  };
}

export interface AdminEventRecordParticipant {
  registrationId: string;
  userId: string;
  name: string;
  email: string;
  profileImageUrl?: string | null;
  rollNumber?: string | null;
  department?: string | null;
  programme?: string | null;
  yearOfStudy?: number | null;
  registrationStatus: string;
  registeredAt: string;
  sessionLabel?: string | null;
  checkedInAt?: string | null;
  attendanceStatus?: 'PRESENT' | 'ABSENT' | 'EXCUSED' | null;
  checkInStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  eventRating?: number | null;
  instructorRating?: number | null;
  eventComment?: string | null;
  instructorComment?: string | null;
  quizScores: {
    moduleId: string;
    moduleTitle: string;
    marksObtained?: number | null;
    completedAt?: string | null;
  }[];
}

export interface AdminEventRecordData {
  event: {
    id: string;
    title: string;
    type: string;
    status: string;
    venue?: string | null;
    startAt: string;
    endAt: string;
  };
  summary: {
    totalRegistrants: number;
    totalAttended: number;
    avgEventRating?: number | null;
    avgInstructorRating?: number | null;
  };
  modules: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    venue?: string | null;
  }[];
  assignments: {
    id: string;
    role: 'INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER';
    notes?: string | null;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  availabilityResponses: {
    id: string;
    isAvailable: boolean;
    note?: string | null;
    respondedAt: string;
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  roster: AdminEventRecordParticipant[];
}
