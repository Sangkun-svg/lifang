import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { createSheetRecord } from '@/lib/admin/sheets';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { SheetRecord, SheetRecordStatus } from '@/types/sheet';

const sheetRecordStatuses = ['미신청', '신고완료', '차단완료'] as const satisfies readonly SheetRecordStatus[];

const createSheetRecordSchema = z.object({
  companyName: z.string().trim().max(500).default(''),
  imageUrl: z.string().trim().max(2000).default(''),
  platform: z.string().trim().max(200).default(''),
  price: z.string().trim().max(100).default(''),
  productName: z.string().trim().min(1).max(500),
  salesCount: z.coerce.number().int().min(0).max(999999999).default(0),
  salesUrl: z.string().trim().max(2000).default(''),
  searchDate: z.string().trim().date().or(z.literal('')).default(''),
  status: z.enum(sheetRecordStatuses).default('미신청'),
});

type CreateSheetRecordData = {
  record: SheetRecord;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<CreateSheetRecordData>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  const sheetId = Array.isArray(req.query.sheetId) ? req.query.sheetId[0] : req.query.sheetId;

  if (!sheetId || !z.string().uuid().safeParse(sheetId).success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '시트를 확인해주세요.');
  }

  const parsedBody = createSheetRecordSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '추가할 행 정보를 확인해주세요.');
  }

  try {
    const record = await createSheetRecord(sheetId, {
      ...parsedBody.data,
      category: parsedBody.data.platform,
    });

    return sendSuccess(res, { record });
  } catch (error) {
    console.error('Create sheet record failed', error);

    if (error instanceof Error && error.message === 'SHEET_NOT_FOUND') {
      return sendFailure(res, 404, 'SHEET_NOT_FOUND', '시트를 찾을 수 없습니다.');
    }

    return sendFailure(res, 500, 'SHEET_RECORD_CREATE_FAILED', '시트 행을 추가할 수 없습니다.');
  }
}
