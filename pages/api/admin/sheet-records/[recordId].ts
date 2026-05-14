import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { updateSheetRecord } from '@/lib/admin/sheets';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { SheetRecord, SheetRecordStatus } from '@/types/sheet';

const sheetRecordStatuses = ['미신청', '신고완료', '차단완료'] as const satisfies readonly SheetRecordStatus[];

const updateSheetRecordSchema = z.object({
  blockApproval: z.string().max(500).default(''),
  blockObjection: z.string().max(500).default(''),
  blockObjectionDecision: z.string().max(500).default(''),
  blockObjectionReason: z.string().max(1000).default(''),
  blockReapproval: z.string().max(500).default(''),
  blockRejectionReason: z.string().max(1000).default(''),
  blockReport: z.string().max(500).default(''),
  blockRereport: z.string().max(500).default(''),
  blockRereportRejectionReason: z.string().max(1000).default(''),
  blockStatus: z.enum(sheetRecordStatuses),
  sheetId: z.string().uuid(),
});

type SheetRecordData = {
  record: SheetRecord;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<SheetRecordData>>) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  const recordId = Array.isArray(req.query.recordId) ? req.query.recordId[0] : req.query.recordId;

  if (!recordId) {
    return sendFailure(res, 400, 'INVALID_INPUT', '시트 레코드를 확인해주세요.');
  }

  const parsedBody = updateSheetRecordSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '저장할 값을 확인해주세요.');
  }

  try {
    const record = await updateSheetRecord(parsedBody.data.sheetId, recordId, parsedBody.data);

    if (!record) {
      return sendFailure(res, 404, 'SHEET_RECORD_NOT_FOUND', '시트 레코드를 찾을 수 없습니다.');
    }

    return sendSuccess(res, { record });
  } catch (error) {
    console.error('Update sheet record failed', error);
    return sendFailure(res, 500, 'SHEET_RECORD_UPDATE_FAILED', '시트 레코드를 저장할 수 없습니다.');
  }
}
