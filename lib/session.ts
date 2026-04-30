import type { AuthPayload } from '@/types';

export const TOKEN_KEY = 'fh_token';
export const REFRESH_TOKEN_KEY = 'fh_refresh_token';
export const USER_KEY = 'fh_user';

type JwtPayload = AuthPayload & {
  exp?: number;
  frontendRole?: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function buildCookie(token: string): string {
  const secure = isBrowser() && window.location.protocol === 'https:' ? '; secure' : '';
  return `fh_auth=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax${secure}`;
}

export function setStoredToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = buildCookie(token);
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearStoredToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_KEY);
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `fh_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=lax${secure}`;
}

export function setStoredRefreshToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getStoredRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearStoredRefreshToken(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setStoredUser(user: AuthPayload): void {
  if (!isBrowser()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): AuthPayload | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthPayload) : null;
  } catch {
    return null;
  }
}

export function clearStoredUser(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(USER_KEY);
}

export function clearStoredSession(): void {
  clearStoredToken();
  clearStoredRefreshToken();
  clearStoredUser();
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
