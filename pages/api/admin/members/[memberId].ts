import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { deleteAdminMember, updateAdminMember } from '@/lib/admin/members';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { Member } from '@/types/member';

const updateMemberSchema = z.object({
  companyName: z.string().trim().min(1),
  managerName: z.string().trim().min(1),
  sheetIds: z.array(z.string().uuid()).default([]),
});

type UpdateMemberData = {
  member: Member;
  redirectTo: string;
};

type DeleteMemberData = {
  redirectTo: string;
};

type MemberDetailMutationData = UpdateMemberData | DeleteMemberData;

function getUpdateInputErrorMessage(error: z.ZodError) {
  const issue = error.issues[0];
  const field = issue?.path[0];

  if (field === 'companyName') {
    return '업체명을 입력해주세요.';
  }

  if (field === 'managerName') {
    return '담당자를 입력해주세요.';
  }

  return '입력값을 확인해주세요.';
}

function getUpdateFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message === 'MEMBER_NOT_FOUND' || message === 'MEMBER_NOT_FOUND_AFTER_UPDATE') {
    return {
      code: 'MEMBER_NOT_FOUND',
      message: '수정할 회원을 찾을 수 없습니다.',
      status: 404,
    };
  }

  if (message === 'SHEET_NOT_FOUND') {
    return {
      code: 'SHEET_NOT_FOUND',
      message: '선택한 시트를 찾을 수 없습니다.',
      status: 400,
    };
  }

  if (message === 'SHEET_ALREADY_ASSIGNED') {
    return {
      code: 'SHEET_ALREADY_ASSIGNED',
      message: '이미 다른 유저에게 등록된 시트입니다.',
      status: 409,
    };
  }

  return {
    code: 'MEMBER_UPDATE_FAILED',
    message: '회원 정보를 수정할 수 없습니다.',
    status: 500,
  };
}

function getDeleteFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message === 'MEMBER_NOT_FOUND') {
    return {
      code: 'MEMBER_NOT_FOUND',
      message: '삭제할 회원을 찾을 수 없습니다.',
      status: 404,
    };
  }

  return {
    code: 'MEMBER_DELETE_FAILED',
    message: '회원을 삭제할 수 없습니다.',
    status: 500,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<MemberDetailMutationData>>) {
  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'PATCH, DELETE');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  const memberId = Array.isArray(req.query.memberId) ? req.query.memberId[0] : req.query.memberId;

  if (!memberId) {
    return sendFailure(res, 400, 'INVALID_MEMBER_ID', req.method === 'DELETE' ? '삭제할 회원을 찾을 수 없습니다.' : '수정할 회원을 찾을 수 없습니다.');
  }

  if (req.method === 'DELETE') {
    try {
      await deleteAdminMember(memberId);

      return sendSuccess(res, {
        redirectTo: '/admin/members',
      });
    } catch (error) {
      console.error('Delete admin member failed', error);
      const failure = getDeleteFailureMessage(error);

      return sendFailure(res, failure.status, failure.code, failure.message);
    }
  }

  const parsedBody = updateMemberSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', getUpdateInputErrorMessage(parsedBody.error));
  }

  try {
    const member = await updateAdminMember(memberId, {
      companyName: parsedBody.data.companyName,
      managerName: parsedBody.data.managerName,
      sheetIds: parsedBody.data.sheetIds,
    });

    return sendSuccess(res, {
      member,
      redirectTo: '/admin/members',
    });
  } catch (error) {
    console.error('Update admin member failed', error);
    const failure = getUpdateFailureMessage(error);

    return sendFailure(res, failure.status, failure.code, failure.message);
  }
}
