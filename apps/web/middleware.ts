import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES } from "@/lib/cookies";
import { decodeJwtPayload } from "@/lib/jwt";

const LOGIN_PATH = "/";
const PROTECTED_PATHS = ["/chat"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function hasValidAuth(request: NextRequest): boolean {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.access)?.value;
  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refresh)?.value;

  if (!accessToken && !refreshToken) return false;

  // If we have a non-expired access token, we're good
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.exp && Date.now() / 1000 < payload.exp - 60) return true;
  }

  // If we have a non-expired refresh token, client will refresh
  if (refreshToken) {
    const payload = decodeJwtPayload(refreshToken);
    if (payload?.exp && Date.now() / 1000 < payload.exp - 60) return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtectedPath(pathname)) {
    if (!hasValidAuth(request)) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If logged in and on login page, redirect to chat
  if (pathname === LOGIN_PATH && hasValidAuth(request)) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/chat", "/chat/:path*"],
};
