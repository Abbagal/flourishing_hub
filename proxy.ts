import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/home', '/student', '/instructor', '/admin', '/volunteer', '/associate-instructor'];
const ROLE_PATHS: Record<string, string> = {
  student: '/student',
  instructor: '/instructor',
  admin: '/admin',
  volunteer: '/student',
  'associate-instructor': '/associate-instructor',
};

function decodeToken(token: string) {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')));
  } catch {
    return null;
  }
}

function resolveFrontendRole(payload: { role?: string; frontendRole?: string } | null): string | null {
  if (!payload) return null;
  if (payload.frontendRole) return payload.frontendRole;

  const normalized = payload.role?.toLowerCase();
  return normalized ?? null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('fh_auth')?.value;
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));

  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      const payload = decodeToken(token);
      if (resolveFrontendRole(payload)) {
        return NextResponse.redirect(new URL('/home', request.url));
      }
    }

    return NextResponse.next();
  }

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = decodeToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const correctPath = ROLE_PATHS[resolveFrontendRole(payload) ?? ''];
    if (correctPath && !pathname.startsWith(correctPath)) {
      return NextResponse.redirect(new URL(correctPath, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/signup', '/home', '/student/:path*', '/instructor/:path*', '/admin/:path*', '/volunteer/:path*', '/associate-instructor/:path*'],
};
