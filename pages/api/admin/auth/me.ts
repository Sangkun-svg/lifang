import type { NextApiRequest, NextApiResponse } from 'next';

import type { AdminSessionUser } from '@/lib/auth/admin';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';

type MeData = {
  user: AdminSessionUser;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<MeData>>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  try {
    const user = await getAdminSessionUser(req, res);

    if (!user) {
      return sendFailure(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
    }

    return sendSuccess(res, { user });
  } catch (error) {
    console.error('Admin session check failed', error);
    return sendFailure(res, 500, 'SESSION_CHECK_FAILED', '로그인 상태를 확인할 수 없습니다.');
  }
}
