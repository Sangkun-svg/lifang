import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { createAdminRequest } from '@/lib/admin/requests';
import { getUserSessionUser } from '@/lib/auth/user';
import { getProductHistoryItem, getScopedUserProductSummaries } from '@/lib/user/productHistory';
import type { AdminRequest } from '@/types/adminRequest';

const createRequestSchema = z.object({
  itemId: z.string().min(1),
  product: z.string().min(1),
});

type RequestData = {
  request: AdminRequest;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<RequestData>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getUserSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const parsedBody = createRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '요청할 데이터를 확인해주세요.');
  }

  const products = await getScopedUserProductSummaries(user);
  const item = await getProductHistoryItem(parsedBody.data.product, parsedBody.data.itemId, products);

  if (!item) {
    return sendFailure(res, 404, 'ITEM_NOT_FOUND', '요청할 데이터를 찾을 수 없습니다.');
  }

  try {
    const request = await createAdminRequest({
      item,
      product: item.product,
      userEmail: user.email,
      userId: user.id,
    });

    return sendSuccess(res, { request });
  } catch (error) {
    console.error('Create user request failed', error);
    return sendFailure(res, 500, 'REQUEST_CREATE_FAILED', '요청을 저장할 수 없습니다.');
  }
}
