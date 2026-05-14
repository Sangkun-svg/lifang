import type { NextApiRequest, NextApiResponse } from 'next';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { deleteExpiredUnmatchedSheets } from '@/lib/admin/sheets';
import { getAdminSessionUser } from '@/lib/auth/admin';

type CleanupData = {
  deletedCount: number;
  retentionDays: number;
};

function isAuthorizedCronRequest(req: NextApiRequest) {
  const cronSecret = process.env.CRON_SECRET;

  return Boolean(cronSecret) && req.headers.authorization === `Bearer ${cronSecret}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<CleanupData>>) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const isCron = isAuthorizedCronRequest(req);
  const adminUser = isCron ? null : await getAdminSessionUser(req, res);

  if (!isCron && !adminUser) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  try {
    const result = await deleteExpiredUnmatchedSheets();

    return sendSuccess(res, result);
  } catch (error) {
    console.error('Cleanup unmatched sheets failed', error);
    return sendFailure(res, 500, 'SHEET_CLEANUP_FAILED', '만료된 시트를 정리할 수 없습니다.');
  }
}
