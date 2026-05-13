import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { updateAdminRequest } from '@/lib/admin/requests';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { AdminRequest, AdminRequestStatus } from '@/types/adminRequest';

const adminRequestStatuses = ['신규요청', '처리중', '처리완료', '반려'] as const satisfies readonly AdminRequestStatus[];

const updateRequestSchema = z.object({
  blockApproval: z.string().max(500).default(''),
  blockObjection: z.string().max(500).default(''),
  blockObjectionDecision: z.string().max(500).default(''),
  blockObjectionReason: z.string().max(1000).default(''),
  blockReapproval: z.string().max(500).default(''),
  blockRejectionReason: z.string().max(1000).default(''),
  blockReport: z.string().max(500).default(''),
  blockRereport: z.string().max(500).default(''),
  blockRereportRejectionReason: z.string().max(1000).default(''),
  blockStatus: z.string().max(500).default(''),
  status: z.enum(adminRequestStatuses),
});

type RequestData = {
  request: AdminRequest;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<RequestData>>) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  const requestId = Array.isArray(req.query.requestId) ? req.query.requestId[0] : req.query.requestId;

  if (!requestId) {
    return sendFailure(res, 400, 'INVALID_INPUT', '요청 정보를 확인해주세요.');
  }

  const parsedBody = updateRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '저장할 값을 확인해주세요.');
  }

  try {
    const request = await updateAdminRequest(requestId, parsedBody.data);

    if (!request) {
      return sendFailure(res, 404, 'REQUEST_NOT_FOUND', '요청 정보를 찾을 수 없습니다.');
    }

    return sendSuccess(res, { request });
  } catch (error) {
    console.error('Update admin request failed', error);
    return sendFailure(res, 500, 'REQUEST_UPDATE_FAILED', '요청 정보를 저장할 수 없습니다.');
  }
}
