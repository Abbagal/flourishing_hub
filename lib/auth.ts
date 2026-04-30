import { loginRequest, meRequest, registerRequest } from '@/lib/api';
import type { AuthPayload, Programme } from '@/types';
import {
  clearStoredSession,
  decodeJwtPayload,
  getStoredRefreshToken,
  getStoredToken,
  getStoredUser as getStoredUserFromSession,
  setStoredRefreshToken,
  setStoredToken,
  setStoredUser,
} from '@/lib/session';

function persistAuth(payload: { token?: string; accessToken?: string; refreshToken?: string; user: AuthPayload }): void {
  const token = payload.accessToken ?? payload.token;
  if (token) {
    setStoredToken(token);
  }

  if (payload.refreshToken) {
    setStoredRefreshToken(payload.refreshToken);
  } else if (!getStoredRefreshToken()) {
    clearStoredSession();
    return;
  }

  setStoredUser(payload.user);
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const data = await loginRequest(email, password);
  persistAuth(data);
  return data.user;
}

export async function registerStudent(payload: {
  name: string;
  rollNo: string;
  year: number;
  batch: string;
  programme: Programme;
  department: string;
  email: string;
  password: string;
}): Promise<AuthPayload> {
  const programmeMap: Record<Programme, 'BTECH' | 'MTECH' | 'PHD' | 'MSC' | 'MA' | 'OTHER'> = {
    BTech: 'BTECH',
    MTech: 'MTECH',
    PhD: 'PHD',
    MSc: 'MSC',
    MA: 'MA',
    Other: 'OTHER',
  };

  await registerRequest({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: 'STUDENT',
    studentProfile: {
      rollNumber: payload.rollNo,
      department: payload.department,
      yearOfStudy: payload.year,
      programme: programmeMap[payload.programme],
      cohort: payload.batch,
    },
  });

  return login(payload.email, payload.password);
}

export function logout(): void {
  clearStoredSession();
}

export function getStoredUser(): AuthPayload | null {
  return getStoredUserFromSession();
}

export function decodeToken(token: string): AuthPayload | null {
  return decodeJwtPayload(token);
}

export function isAuthenticated(): boolean {
  const token = getStoredToken();
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload) return false;
  return !payload.exp || payload.exp * 1000 > Date.now();
}

export async function syncStoredUser(): Promise<AuthPayload | null> {
  const token = getStoredToken();
  if (!token) {
    return null;
  }

  try {
    const data = await meRequest();
    persistAuth(data);
    return data.user;
  } catch {
    logout();
    return null;
  }
}
