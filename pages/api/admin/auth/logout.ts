import type { NextApiRequest, NextApiResponse } from 'next';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { clearAdminAuthCookies } from '@/lib/auth/cookies';

type LogoutData = {
  loggedOut: true;
};

export default function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<LogoutData>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  clearAdminAuthCookies(res);
  return sendSuccess(res, { loggedOut: true });
}
