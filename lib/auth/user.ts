import type { User } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';

import { isAdminUser } from '@/lib/auth/admin';
import {
  clearUserAuthCookies,
  getUserAuthCookies,
  isLocalDevUserCookie,
  setUserAuthCookies,
} from '@/lib/auth/cookies';
import { isLocalAuthBypassEnabled } from '@/lib/auth/local-bypass';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export type UserSessionUser = {
  id: string;
  email: string;
};

export function mapUserSessionUser(user: User): UserSessionUser {
  return {
    id: user.id,
    email: user.email ?? '',
  };
}

export async function getUserSessionUser(req: IncomingMessage, res?: ServerResponse) {
  const { accessToken, refreshToken } = getUserAuthCookies(req);

  if (!accessToken && !refreshToken) {
    return null;
  }

  if (isLocalAuthBypassEnabled() && isLocalDevUserCookie(accessToken, refreshToken)) {
    return {
      id: 'local-dev-user',
      email: 'local-dev-user@lifang.local',
    };
  }

  const supabase = createServerSupabaseClient();

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (!error && data.user && !isAdminUser(data.user)) {
      return mapUserSessionUser(data.user);
    }
  }

  if (!refreshToken) {
    if (res) {
      clearUserAuthCookies(res);
    }

    return null;
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user || isAdminUser(data.user)) {
    if (res) {
      clearUserAuthCookies(res);
    }

    return null;
  }

  if (res) {
    setUserAuthCookies(res, data.session);
  }

  return mapUserSessionUser(data.user);
}
