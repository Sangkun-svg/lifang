import type { User } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

import {
  clearAdminAuthCookies,
  getAdminAuthCookies,
  isLocalDevAdminCookie,
  setAdminAuthCookies,
} from '@/lib/auth/cookies';
import { isLocalAuthBypassEnabled } from '@/lib/auth/local-bypass';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type AdminSessionUser = {
  id: string;
  email: string;
};

function readRole(metadata: object | null | undefined) {
  if (!metadata) {
    return null;
  }

  const value = (metadata as Record<string, unknown>).role;
  return typeof value === 'string' ? value : null;
}

function getAllowedAdminEmails() {
  return (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User) {
  const role = readRole(user.app_metadata) ?? readRole(user.user_metadata);

  if (role === 'admin') {
    return true;
  }

  const email = user.email?.toLowerCase();

  if (!email) {
    return false;
  }

  return getAllowedAdminEmails().includes(email);
}

export function mapAdminSessionUser(user: User): AdminSessionUser {
  return {
    id: user.id,
    email: user.email ?? '',
  };
}

export async function getAdminSessionUser(req: IncomingMessage, res?: ServerResponse) {
  const { accessToken, refreshToken } = getAdminAuthCookies(req);

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (isLocalAuthBypassEnabled() && isLocalDevAdminCookie(accessToken, refreshToken)) {
    return {
      id: 'local-dev-admin',
      email: 'local-dev-admin@lifang.local',
    };
  }

  const supabase = createServerSupabaseClient();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error && data.user && isAdminUser(data.user)) {
      return mapAdminSessionUser(data.user);
    }
  }

  if (!refreshToken) {
    if (res) {
      clearAdminAuthCookies(res);
    }

    return null;
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user || !isAdminUser(data.user)) {
    if (res) {
      clearAdminAuthCookies(res);
    }

    return null;
  }

  if (res) {
    setAdminAuthCookies(res, data.session);
  }

  return mapAdminSessionUser(data.user);
}
