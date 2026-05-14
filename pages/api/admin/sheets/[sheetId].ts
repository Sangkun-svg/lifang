import type { NextApiRequest, NextApiResponse } from 'next';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { deleteSheet, getSheetSummaryById } from '@/lib/admin/sheets';
import { getAdminSessionUser } from '@/lib/auth/admin';

type DeleteSheetData = {
  deleted: true;
};

function getSheetOwnerLabel(sheet: Awaited<ReturnType<typeof getSheetSummaryById>>) {
  if (!sheet) {
    return '해당 유저';
  }

  return sheet.customerName || sheet.customerEmail || '해당 유저';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<DeleteSheetData>>) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  const sheetId = Array.isArray(req.query.sheetId) ? req.query.sheetId[0] : req.query.sheetId;

  if (!sheetId) {
    return sendFailure(res, 400, 'INVALID_INPUT', '삭제할 시트를 확인해주세요.');
  }

  try {
    const sheet = await getSheetSummaryById(sheetId);

    if (!sheet) {
      return sendFailure(res, 404, 'SHEET_NOT_FOUND', '삭제할 시트를 찾을 수 없습니다.');
    }

    if (sheet.isMatched) {
      return sendFailure(
        res,
        409,
        'SHEET_ASSIGNED_TO_CUSTOMER',
        `${getSheetOwnerLabel(sheet)} 계정에 등록된 시트라 삭제할 수 없습니다.`
      );
    }

    await deleteSheet(sheetId);

    return sendSuccess(res, {
      deleted: true,
    });
  } catch (error) {
    console.error('Delete sheet failed', error);

    if (error instanceof Error && error.message === 'SHEET_ASSIGNED_TO_CUSTOMER') {
      return sendFailure(res, 409, 'SHEET_ASSIGNED_TO_CUSTOMER', '등록된 유저가 있는 시트는 삭제할 수 없습니다.');
    }

    if (error instanceof Error && error.message === 'SHEET_NOT_FOUND') {
      return sendFailure(res, 404, 'SHEET_NOT_FOUND', '삭제할 시트를 찾을 수 없습니다.');
    }

    return sendFailure(res, 500, 'SHEET_DELETE_FAILED', '시트를 삭제할 수 없습니다.');
  }
}
