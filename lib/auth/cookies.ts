import type { Session } from '@supabase/supabase-js';
import type { NextApiResponse } from 'next';
import type { IncomingMessage, ServerResponse } from 'http';

const ACCESS_TOKEN_COOKIE = 'lifang_admin_access_token';
const REFRESH_TOKEN_COOKIE = 'lifang_admin_refresh_token';
const LOCAL_DEV_ACCESS_TOKEN = 'lifang_local_dev_admin_access_token';
const LOCAL_DEV_REFRESH_TOKEN = 'lifang_local_dev_admin_refresh_token';
const USER_ACCESS_TOKEN_COOKIE = 'lifang_user_access_token';
const USER_REFRESH_TOKEN_COOKIE = 'lifang_user_refresh_token';
const LOCAL_DEV_USER_ACCESS_TOKEN = 'lifang_local_dev_user_access_token';
const LOCAL_DEV_USER_REFRESH_TOKEN = 'lifang_local_dev_user_refresh_token';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type CookieOptions = {
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
};

export type AdminAuthCookies = {
  accessToken: string | null;
  refreshToken: string | null;
};

export type UserAuthCookies = {
  accessToken: string | null;
  refreshToken: string | null;
};

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  segments.push(`Path=${options.path ?? '/'}`);

  if (options.httpOnly) {
    segments.push('HttpOnly');
  }

  if (options.sameSite) {
    segments.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    segments.push('Secure');
  }

  return segments.join('; ');
}

function parseCookieHeader(cookieHeader: string | undefined) {
  const cookies = new Map<string, string>();

  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');

    if (!rawName || rawValue.length === 0) {
      continue;
    }

    cookies.set(rawName, decodeURIComponent(rawValue.join('=')));
  }

  return cookies;
}

function appendSetCookieHeader(res: NextApiResponse | ServerResponse, cookies: string[]) {
  const currentHeader = res.getHeader('Set-Cookie');

  if (!currentHeader) {
    res.setHeader('Set-Cookie', cookies);
    return;
  }

  const currentCookies = Array.isArray(currentHeader) ? currentHeader : [String(currentHeader)];
  res.setHeader('Set-Cookie', [...currentCookies, ...cookies]);
}

export function getAdminAuthCookies(req: IncomingMessage): AdminAuthCookies {
  const cookies = parseCookieHeader(req.headers.cookie);

  return {
    accessToken: cookies.get(ACCESS_TOKEN_COOKIE) ?? null,
    refreshToken: cookies.get(REFRESH_TOKEN_COOKIE) ?? null,
  };
}

export function getUserAuthCookies(req: IncomingMessage): UserAuthCookies {
  const cookies = parseCookieHeader(req.headers.cookie);

  return {
    accessToken: cookies.get(USER_ACCESS_TOKEN_COOKIE) ?? null,
    refreshToken: cookies.get(USER_REFRESH_TOKEN_COOKIE) ?? null,
  };
}

export function setAdminAuthCookies(res: NextApiResponse | ServerResponse, session: Session) {
  const secure = process.env.NODE_ENV === 'production';
  const options: CookieOptions = {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'Lax',
    secure,
  };

  appendSetCookieHeader(res, [
    serializeCookie(ACCESS_TOKEN_COOKIE, session.access_token, options),
    serializeCookie(REFRESH_TOKEN_COOKIE, session.refresh_token, options),
  ]);
}

export function setUserAuthCookies(res: NextApiResponse | ServerResponse, session: Session) {
  const secure = process.env.NODE_ENV === 'production';
  const options: CookieOptions = {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'Lax',
    secure,
  };

  appendSetCookieHeader(res, [
    serializeCookie(USER_ACCESS_TOKEN_COOKIE, session.access_token, options),
    serializeCookie(USER_REFRESH_TOKEN_COOKIE, session.refresh_token, options),
  ]);
}

export function isLocalDevAdminCookie(accessToken: string | null, refreshToken: string | null) {
  return accessToken === LOCAL_DEV_ACCESS_TOKEN && refreshToken === LOCAL_DEV_REFRESH_TOKEN;
}

export function isLocalDevUserCookie(accessToken: string | null, refreshToken: string | null) {
  return accessToken === LOCAL_DEV_USER_ACCESS_TOKEN && refreshToken === LOCAL_DEV_USER_REFRESH_TOKEN;
}

export function setLocalDevAdminAuthCookies(res: NextApiResponse | ServerResponse) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const options: CookieOptions = {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'Lax',
    secure: false,
  };

  appendSetCookieHeader(res, [
    serializeCookie(ACCESS_TOKEN_COOKIE, LOCAL_DEV_ACCESS_TOKEN, options),
    serializeCookie(REFRESH_TOKEN_COOKIE, LOCAL_DEV_REFRESH_TOKEN, options),
  ]);
}

export function setLocalDevUserAuthCookies(res: NextApiResponse | ServerResponse) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const options: CookieOptions = {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'Lax',
    secure: false,
  };

  appendSetCookieHeader(res, [
    serializeCookie(USER_ACCESS_TOKEN_COOKIE, LOCAL_DEV_USER_ACCESS_TOKEN, options),
    serializeCookie(USER_REFRESH_TOKEN_COOKIE, LOCAL_DEV_USER_REFRESH_TOKEN, options),
  ]);
}

export function clearAdminAuthCookies(res: NextApiResponse | ServerResponse) {
  const secure = process.env.NODE_ENV === 'production';
  const options: CookieOptions = {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    secure,
  };

  appendSetCookieHeader(res, [
    serializeCookie(ACCESS_TOKEN_COOKIE, '', options),
    serializeCookie(REFRESH_TOKEN_COOKIE, '', options),
  ]);
}

export function clearUserAuthCookies(res: NextApiResponse | ServerResponse) {
  const secure = process.env.NODE_ENV === 'production';
  const options: CookieOptions = {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'Lax',
    secure,
  };

  appendSetCookieHeader(res, [
    serializeCookie(USER_ACCESS_TOKEN_COOKIE, '', options),
    serializeCookie(USER_REFRESH_TOKEN_COOKIE, '', options),
  ]);
}
