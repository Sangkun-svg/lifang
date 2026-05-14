import type { NextApiRequest, NextApiResponse } from 'next';

import type { ApiResponse } from '@/lib/api/responses';
import { sendFailure, sendSuccess } from '@/lib/api/responses';
import { createSheetUpload } from '@/lib/admin/sheets';
import { parseSheetRecords } from '@/lib/admin/sheetParser';
import { getAdminSessionUser } from '@/lib/auth/admin';
import { notifyServerError } from '@/lib/notifications/slack';
import type { SheetSummary } from '@/types/sheet';

export const config = {
  api: {
    bodyParser: false,
  },
};

type UploadData = {
  redirectTo: string;
  sheet: SheetSummary;
};

type UploadedFile = {
  buffer: Buffer;
  fileName: string;
};

type MultipartForm = {
  fields: Map<string, string>;
  file: UploadedFile | null;
};

function stripHeaderQuotes(value: string) {
  return value.trim().replace(/^"|"$/g, '');
}

function decodeHeaderFileName(value: string) {
  const strippedValue = stripHeaderQuotes(value);

  try {
    return decodeURIComponent(strippedValue);
  } catch {
    return Buffer.from(strippedValue, 'latin1').toString('utf8');
  }
}

function decodeExtendedHeaderFileName(value: string) {
  const strippedValue = stripHeaderQuotes(value);
  const encodedValue = strippedValue.toLowerCase().startsWith("utf-8''") ? strippedValue.slice(7) : strippedValue;

  try {
    return decodeURIComponent(encodedValue);
  } catch {
    return decodeHeaderFileName(encodedValue);
  }
}

function parseContentDisposition(value: string) {
  const nameMatch = /name="([^"]+)"/.exec(value);
  const extendedFileNameMatch = /filename\*=([^;]+)/i.exec(value);
  const fileNameMatch = /filename="([^"]*)"/.exec(value);

  return {
    fileName: extendedFileNameMatch?.[1]
      ? decodeExtendedHeaderFileName(extendedFileNameMatch[1])
      : fileNameMatch?.[1]
        ? decodeHeaderFileName(fileNameMatch[1])
        : null,
    name: nameMatch?.[1] ?? null,
  };
}

function parseMultipartForm(buffer: Buffer, contentType: string): MultipartForm {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType);

  if (!boundaryMatch) {
    return {
      fields: new Map<string, string>(),
      file: null,
    };
  }

  const boundary = `--${boundaryMatch[1] ?? boundaryMatch[2]}`;
  const body = buffer.toString('latin1');
  const fields = new Map<string, string>();
  let file: UploadedFile | null = null;

  for (const rawPart of body.split(boundary)) {
    const part = rawPart.replace(/^\r\n/, '').replace(/\r\n$/, '');

    if (!part || part === '--') {
      continue;
    }

    const headerEndIndex = part.indexOf('\r\n\r\n');

    if (headerEndIndex < 0) {
      continue;
    }

    const headerText = part.slice(0, headerEndIndex);
    const contentText = part.slice(headerEndIndex + 4).replace(/\r\n--$/, '');
    const dispositionLine = headerText.split('\r\n').find((line) => line.toLowerCase().startsWith('content-disposition'));

    if (!dispositionLine) {
      continue;
    }

    const { fileName, name } = parseContentDisposition(dispositionLine);

    if (!name) {
      continue;
    }

    if (fileName !== null) {
      file = {
        buffer: Buffer.from(contentText, 'latin1'),
        fileName: fileName || 'upload.xlsx',
      };
      continue;
    }

    fields.set(name, Buffer.from(contentText, 'latin1').toString('utf8').trim());
  }

  return { fields, file };
}

async function readRequestBuffer(req: NextApiRequest) {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function getUploadFailure(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message === 'SHEET_NAME_ALREADY_EXISTS') {
    return {
      code: 'SHEET_NAME_ALREADY_EXISTS',
      message: '이미 사용 중인 시트명입니다.',
      status: 409,
    };
  }

  return {
    code: 'SHEET_UPLOAD_FAILED',
    message: '시트 데이터를 저장할 수 없습니다.',
    status: 500,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse<UploadData>>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendFailure(res, 405, 'METHOD_NOT_ALLOWED', '허용되지 않은 요청입니다.');
  }

  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return sendFailure(res, 401, 'UNAUTHORIZED', '로그인이 필요합니다.');
  }

  const contentType = req.headers['content-type'];

  if (!contentType || !contentType.includes('multipart/form-data')) {
    return sendFailure(res, 400, 'INVALID_CONTENT_TYPE', '엑셀 파일을 multipart/form-data로 업로드해주세요.');
  }

  let fileName = '';
  let recordCount = 0;
  let sheetName = '';

  try {
    const form = parseMultipartForm(await readRequestBuffer(req), contentType);

    if (!form.file) {
      return sendFailure(res, 400, 'FILE_REQUIRED', '업로드할 엑셀 파일을 선택해주세요.');
    }

    fileName = form.file.fileName;
    const records = parseSheetRecords(form.file.buffer);
    recordCount = records.length;

    if (records.length === 0) {
      return sendFailure(res, 400, 'EMPTY_SHEET', '저장할 수 있는 시트 데이터가 없습니다.');
    }

    sheetName = form.fields.get('sheetName') || form.file.fileName.replace(/\.[^.]+$/, '') || '업로드 시트';
    const sheet = await createSheetUpload({
      name: sheetName,
      originalFileName: form.file.fileName,
      records,
    });

    return sendSuccess(res, {
      redirectTo: `/admin/sheets/${sheet.id}`,
      sheet,
    });
  } catch (error) {
    console.error('Admin sheet upload failed', error);
    await notifyServerError({
      context: {
        adminEmail: user.email,
        fileName,
        recordCount,
        route: 'POST /api/admin/sheets/upload',
        sheetName,
      },
      error,
      title: 'Admin sheet upload failed',
    });
    const failure = getUploadFailure(error);

    return sendFailure(res, failure.status, failure.code, failure.message);
  }
}
