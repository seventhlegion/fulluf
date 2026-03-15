/**
 * Cookie helpers for auth tokens.
 * Uses cookies so Next.js middleware can read them for route protection.
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USERNAME_KEY = "chat_username";

const COOKIE_OPTS = "path=/; SameSite=Lax; max-age=";

/** 15 min in seconds */
const ACCESS_MAX_AGE = 15 * 60;
/** 7 days in seconds */
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  username: string,
): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=${encodeURIComponent(accessToken)}; ${COOKIE_OPTS}${ACCESS_MAX_AGE}`;
  document.cookie = `${REFRESH_TOKEN_KEY}=${encodeURIComponent(refreshToken)}; ${COOKIE_OPTS}${REFRESH_MAX_AGE}`;
  document.cookie = `${USERNAME_KEY}=${encodeURIComponent(username)}; ${COOKIE_OPTS}${REFRESH_MAX_AGE}`;
}

export function clearAuthCookies(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
  document.cookie = `${USERNAME_KEY}=; path=/; max-age=0`;
}

export function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ACCESS_TOKEN_KEY}=([^;]*)`),
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

export function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${REFRESH_TOKEN_KEY}=([^;]*)`),
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

export function getUsernameFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${USERNAME_KEY}=([^;]*)`),
  );
  const value = match?.[1];
  return value ? decodeURIComponent(value) : null;
}

/** Cookie names for middleware (Edge can't use the getters) */
export const AUTH_COOKIE_NAMES = {
  access: ACCESS_TOKEN_KEY,
  refresh: REFRESH_TOKEN_KEY,
  username: USERNAME_KEY,
} as const;
