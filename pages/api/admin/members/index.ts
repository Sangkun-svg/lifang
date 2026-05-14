import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { createAdminMember } from '@/lib/admin/members';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { Member } from '@/types/member';

const createMemberSchema = z
  .object({
    companyName: z.string().trim().min(1),
    email: z.string().trim().email(),
    managerName: z.string().trim().min(1),
    password: z.string().min(6),
    passwordConfirm: z.string().min(6),
    sheetIds: z.array(z.string().uuid()).default([]),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

type CreateMemberData = {
  member: Member;
  redirectTo: string;
};

function getCreateInputErrorMessage(error: z.ZodError) {
  const issue = error.issues[0];
  const field = issue?.path[0];

  if (field === 'email') {
    return '이메일 형식을 확인해주세요.';
  }

  if (field === 'password') {
    return '비밀번호는 6자리 이상 입력해주세요.';
  }

  if (field === 'passwordConfirm') {
    return issue.message === '비밀번호가 일치하지 않습니다.' ? issue.message : '비밀번호 확인은 6자리 이상 입력해주세요.';
  }

  if (field === 'companyName') {
    return '업체명을 입력해주세요.';
  }

  if (field === 'managerName') {
    return '담당자를 입력해주세요.';
  }

  return '입력값을 확인해주세요.';
}

function getCreateFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message === 'EMAIL_ALREADY_EXISTS' || message.toLowerCase().includes('already registered')) {
    return {
      code: 'EMAIL_ALREADY_EXISTS',
      message: '이미 사용 중인 이메일입니다.',
      status: 409,
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
    code: 'MEMBER_CREATE_FAILED',
    message: '계정을 생성할 수 없습니다.',
    status: 500,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<CreateMemberData>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '관리자 로그인이 필요합니다.');
  }

  const parsedBody = createMemberSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', getCreateInputErrorMessage(parsedBody.error));
  }

  try {
    const member = await createAdminMember({
      companyName: parsedBody.data.companyName,
      email: parsedBody.data.email,
      managerName: parsedBody.data.managerName,
      password: parsedBody.data.password,
      sheetIds: parsedBody.data.sheetIds,
    });

    return sendSuccess(res, {
      member,
      redirectTo: '/admin/members',
    }, 201);
  } catch (error) {
    console.error('Create admin member failed', error);
    const failure = getCreateFailureMessage(error);

    return sendFailure(res, failure.status, failure.code, failure.message);
  }
}
