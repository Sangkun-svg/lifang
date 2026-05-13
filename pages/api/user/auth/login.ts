import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { isAdminUser } from '@/lib/auth/admin';
import { clearUserAuthCookies, setLocalDevUserAuthCookies, setUserAuthCookies } from '@/lib/auth/cookies';
import { isLocalAuthBypassEnabled } from '@/lib/auth/local-bypass';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const productionLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const localLoginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

type LoginData = {
  user: {
    id: string;
    email: string;
  };
  redirectTo: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<LoginData>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const shouldBypassAuth = isLocalAuthBypassEnabled();
  const parsedBody = (shouldBypassAuth ? localLoginSchema : productionLoginSchema).safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '이메일과 비밀번호를 확인해주세요.');
  }

  if (shouldBypassAuth) {
    setLocalDevUserAuthCookies(res);

    return sendSuccess(res, {
      user: {
        id: 'local-dev-user',
        email: parsedBody.data.email,
      },
      redirectTo: '/dashboard',
    });
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsedBody.data);

    if (error || !data.session || !data.user) {
      clearUserAuthCookies(res);
      return sendFailure(res, 401, 'INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    if (isAdminUser(data.user)) {
      clearUserAuthCookies(res);
      return sendFailure(res, 403, 'USER_FORBIDDEN', '사용자 계정으로 로그인해주세요.');
    }

    setUserAuthCookies(res, data.session);

    return sendSuccess(res, {
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
      },
      redirectTo: '/dashboard',
    });
  } catch (error) {
    console.error('User login failed', error);
    clearUserAuthCookies(res);
    return sendFailure(res, 500, 'LOGIN_FAILED', '로그인 처리 중 문제가 발생했습니다.');
  }
}
