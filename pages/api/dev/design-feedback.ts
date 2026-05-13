import { mkdir, writeFile } from 'fs/promises';
import type { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { z } from 'zod';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';

const feedbackSchema = z.object({
  comment: z.string().trim().min(1),
  element: z.object({
    height: z.number(),
    selector: z.string(),
    tagName: z.string(),
    text: z.string(),
    width: z.number(),
    x: z.number(),
    y: z.number(),
  }),
  path: z.string(),
  url: z.string().url(),
});

function formatKoreaTimestamp() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}-${values.hour}-${values.minute}-${values.second}`;
}

function pageSlug(value: string) {
  return value
    .replace(/^\/+/, '')
    .replace(/\/+$/g, '')
    .replace(/[^a-zA-Z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'home';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<{ fileName: string }>>) {
  if (process.env.NODE_ENV === 'production') {
    return sendFailure(res, 404, 'NOT_FOUND', '요청한 리소스를 찾을 수 없습니다.');
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const parsedBody = feedbackSchema.safeParse(req.body);

  if (!parsedBody.success) {
    return sendFailure(res, 400, 'INVALID_INPUT', '피드백 내용을 확인해주세요.');
  }

  const feedback = parsedBody.data;
  const directory = path.join(process.cwd(), 'docs', 'design-feedback');
  const fileName = `${formatKoreaTimestamp()}-${pageSlug(feedback.path)}.md`;
  const filePath = path.join(directory, fileName);
  const body = [
    '# Design Feedback',
    '',
    `- URL: ${feedback.url}`,
    `- Path: ${feedback.path}`,
    `- Element: ${feedback.element.selector || feedback.element.tagName}`,
    `- Rect: ${feedback.element.width}x${feedback.element.height} at ${feedback.element.x}, ${feedback.element.y}`,
    `- Text: ${feedback.element.text || '-'}`,
    '',
    '## Comment',
    '',
    feedback.comment,
    '',
  ].join('\n');

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(filePath, body, 'utf8');
    return sendSuccess(res, { fileName });
  } catch (error) {
    console.error('Save design feedback failed', error);
    return sendFailure(res, 500, 'FEEDBACK_SAVE_FAILED', '피드백을 저장할 수 없습니다.');
  }
}
