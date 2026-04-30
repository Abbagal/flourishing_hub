import type {
  AdminEventManagementData,
  AdminEventCatalogItem,
  AdminEventRecordData,
  AdminUserFilters,
  AdminUsersResponse,
  AssociateDashboardData,
  AuthPayload,
  FrontendDashboardResponse,
  FrontendEvent,
  FrontendLoginResponse,
  ImportJob,
  QuizSession,
} from '@/types';
import {
  clearStoredSession,
  getStoredRefreshToken,
  getStoredToken,
  setStoredToken,
  setStoredUser,
} from '@/lib/session';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? JSON.parse(text) as T : ({} as T);
}

type AuthRefreshResponse = {
  token?: string;
  accessToken?: string;
  user: AuthPayload;
};

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    clearStoredSession();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/frontend/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    cache: 'no-store',
    body: JSON.stringify({ refreshToken }),
  });

  const payload = await parseJson<{ message?: string; data?: AuthRefreshResponse }>(response);
  if (!response.ok || !payload.data) {
    clearStoredSession();
    throw new Error(payload.message || 'Session expired');
  }

  const nextToken = payload.data.accessToken ?? payload.data.token;
  if (!nextToken) {
    clearStoredSession();
    throw new Error('Session refresh failed');
  }

  setStoredToken(nextToken);
  setStoredUser(payload.data.user);
  return nextToken;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}, allowRefresh = true): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const token = getStoredToken();
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include',
    cache: 'no-store',
  });

  const payload = await parseJson<{ success?: boolean; message?: string; data?: T }>(response);

  if (!response.ok) {
    if (response.status === 401 && auth && allowRefresh) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        return apiRequest<T>(path, options, false);
      }
    }

    throw new Error(payload.message || 'Request failed');
  }

  return payload.data as T;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export async function loginRequest(email: string, password: string): Promise<FrontendLoginResponse> {
  return apiRequest<FrontendLoginResponse>('/frontend/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function registerRequest(payload: {
  name: string;
  email: string;
  password: string;
  role?: 'STUDENT' | 'VOLUNTEER' | 'INSTRUCTOR';
  studentProfile?: {
    rollNumber: string;
    department: string;
    yearOfStudy: number;
    programme: 'BTECH' | 'MTECH' | 'PHD' | 'MSC' | 'MA' | 'OTHER';
    cohort?: string;
  };
  instructorProfile?: {
    designation?: string;
    department?: string;
  };
}): Promise<unknown> {
  return apiRequest('/auth/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      role: 'STUDENT',
      ...payload,
    }),
  });
}

export async function meRequest(): Promise<{ token: string; user: AuthPayload }> {
  return apiRequest<{ token: string; user: AuthPayload }>('/frontend/auth/me');
}

export async function dashboardRequest(): Promise<FrontendDashboardResponse> {
  return apiRequest<FrontendDashboardResponse>('/frontend/dashboard');
}

export async function eventsRequest(): Promise<FrontendEvent[]> {
  return apiRequest<FrontendEvent[]>('/frontend/events');
}

export async function volunteerRegistrationRequest(eventId: string, register?: boolean): Promise<{ registered: boolean }> {
  return apiRequest<{ registered: boolean }>(`/frontend/events/${eventId}/volunteer`, {
    method: 'POST',
    body: JSON.stringify(register === undefined ? {} : { register }),
  });
}

export async function eventRegistrationRequest(eventId: string, register?: boolean): Promise<{ registered: boolean }> {
  return apiRequest<{ registered: boolean }>(`/frontend/events/${eventId}/register`, {
    method: 'POST',
    body: JSON.stringify(register === undefined ? {} : { register }),
  });
}

export async function eventRegistrationWithSessionRequest(eventId: string, payload: { register?: boolean; moduleId?: string }): Promise<{ registered: boolean }> {
  return apiRequest<{ registered: boolean }>(`/frontend/events/${eventId}/register`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function attendanceRequest(sessionId: string, entries: AssociateDashboardData['attendance']): Promise<{ saved: number; present: number; absent: number }> {
  return apiRequest<{ saved: number; present: number; absent: number }>(`/frontend/sessions/${sessionId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({
      entries: entries.map((entry) => ({
        userId: entry.studentId,
        status: entry.status,
      })),
    }),
  });
}

export async function sessionToggleRequest(sessionId: string, type: 'quiz' | 'feedback', active?: boolean): Promise<QuizSession> {
  return apiRequest<QuizSession>(`/frontend/sessions/${sessionId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({
      type,
      ...(active === undefined ? {} : { active }),
    }),
  });
}

export async function sessionStartRequest(sessionId: string): Promise<{ id: string; status: string }> {
  return apiRequest<{ id: string; status: string }>(`/frontend/sessions/${sessionId}/start`, {
    method: 'POST',
    body: JSON.stringify({ notifyParticipants: true }),
  });
}

export async function adminUsersRequest(search = ''): Promise<AdminUsersResponse> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiRequest<AdminUsersResponse>(`/users${query}`);
}

export async function adminUsersFilteredRequest(filters: AdminUserFilters = {}): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return apiRequest<AdminUsersResponse>(`/users${query ? `?${query}` : ''}`);
}

export async function adminUpdateUserRoleRequest(userId: string, role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'VOLUNTEER'): Promise<unknown> {
  return apiRequest(`/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function adminCreateEventRequest(payload: {
  title: string;
  description: string;
  type: 'OPEN_WORKSHOP' | 'WELLNESS_COURSE' | 'PLACEMENT_WORKSHOP' | 'PHD_WORKSHOP' | 'OTHER';
  bannerImageUrl?: string;
  venue?: string;
  meetLink?: string;
  startAt: string;
  endAt: string;
  registrationOpensAt?: string;
  registrationClosesAt?: string;
  capacity?: number;
  volunteersNeeded?: number;
  allowVolunteerSignup?: boolean;
  requiresCheckIn?: boolean;
  status?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
}): Promise<unknown> {
  return apiRequest('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminImportUploadRequest(type: 'USERS' | 'EVENT_REGISTRATIONS' | 'EVENTS' | 'MARKS' | 'ATTENDANCE', file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);

  return apiRequest('/imports/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function adminImportJobsRequest(): Promise<ImportJob[]> {
  return apiRequest<ImportJob[]>('/imports');
}

export async function checkInRequest(eventId: string, moduleId?: string): Promise<{ checkedInAt: string; checkedInAtLabel: string; status: string }> {
  return apiRequest<{ checkedInAt: string; checkedInAtLabel: string; status: string }>(`/frontend/events/${eventId}/check-in`, {
    method: 'POST',
    body: JSON.stringify(moduleId ? { moduleId } : {}),
  });
}

export async function adminEventManagementRequest(eventId: string): Promise<AdminEventManagementData> {
  return apiRequest<AdminEventManagementData>(`/frontend/events/${eventId}/manage`);
}

export async function adminEventRecordRequest(eventId: string): Promise<AdminEventRecordData> {
  return apiRequest<AdminEventRecordData>(`/events/${eventId}/record`);
}

export async function adminAttendanceUpdateRequest(eventId: string, payload: { userId: string; moduleId?: string; status: 'present' | 'absent' | 'excused' }): Promise<unknown> {
  return apiRequest(`/frontend/events/${eventId}/attendance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function availabilityRequest(eventId: string, payload: { isAvailable: boolean; note?: string }): Promise<unknown> {
  return apiRequest(`/frontend/events/${eventId}/availability`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function selfAssignRequest(eventId: string, note?: string): Promise<unknown> {
  return apiRequest(`/frontend/events/${eventId}/self-assign`, {
    method: 'POST',
    body: JSON.stringify(note ? { note } : {}),
  });
}

export async function adminAssignStaffRequest(eventId: string, payload: { userId: string; role: 'INSTRUCTOR' | 'ASSOCIATE_INSTRUCTOR' | 'VOLUNTEER'; notes?: string }): Promise<unknown> {
  return apiRequest(`/frontend/events/${eventId}/assignments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminExportEventRequest(eventId: string, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/events/${eventId}/export?format=${format}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message || 'Failed to export event data');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-${eventId}.${format}`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function submitFeedbackRequest(eventId: string, payload: {
  eventRating: number;
  instructorRating: number;
  eventComment?: string;
  instructorComment?: string;
}): Promise<unknown> {
  return apiRequest(`/frontend/events/${eventId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reviewCheckInRequest(checkInId: string, payload: {
  status: 'VERIFIED' | 'REJECTED';
  note?: string;
}): Promise<unknown> {
  return apiRequest(`/frontend/check-ins/${checkInId}/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminDownloadImportTemplateRequest(type: 'USERS' | 'EVENT_REGISTRATIONS' | 'EVENTS' | 'MARKS' | 'ATTENDANCE'): Promise<void> {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/imports/templates/${type}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message || 'Failed to download import template');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fh-${type.toLowerCase()}-template.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function adminExportUsersRequest(filters: AdminUserFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
  const token = getStoredToken();
  const params = new URLSearchParams({ format });
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const response = await fetch(`${API_BASE_URL}/users/directory/export?${params.toString()}`, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response);
    throw new Error(payload.message || 'Failed to export member directory');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fh-member-directory.${format}`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export async function adminEventsCatalogRequest(filters: {
  status?: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  type?: 'OPEN_WORKSHOP' | 'WELLNESS_COURSE' | 'PLACEMENT_WORKSHOP' | 'PHD_WORKSHOP' | 'OTHER';
  upcomingOnly?: boolean;
} = {}): Promise<{ items: AdminEventCatalogItem[]; total: number; page: number; limit: number }> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.upcomingOnly !== undefined) params.set('upcomingOnly', String(filters.upcomingOnly));

  return apiRequest<{ items: AdminEventCatalogItem[]; total: number; page: number; limit: number }>(
    `/events${params.toString() ? `?${params.toString()}` : ''}`,
  );
}
