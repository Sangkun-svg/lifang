import type { NextApiResponse } from 'next';

export type ApiSuccess<TData> = {
  ok: true;
  data: TData;
};

export type ApiFailure = {
  ok: false;
  code: string;
  message: string;
};

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;

export function sendSuccess<TData>(res: NextApiResponse<ApiResponse<TData>>, data: TData, status = 200) {
  return res.status(status).json({
    ok: true,
    data,
  });
}

export function sendFailure<TData>(
  res: NextApiResponse<ApiResponse<TData>>,
  status: number,
  code: string,
  message: string,
) {
  return res.status(status).json({
    ok: false,
    code,
    message,
  });
}
