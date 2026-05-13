import * as XLSX from 'xlsx';

import type { CreateSheetRecordInput } from '@/lib/admin/sheets';
import type { SheetRecordStatus } from '@/types/sheet';

type SheetRow = Record<string, unknown>;

const defaultSearchDate = '2026-04-02';
const expectedHeaderNames = ['순번', '검색 날짜', '제품명칭', '판매업체명칭', '침해제품링크주소'];

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/￥/g, '¥')
    .replace(/\s+/g, '')
    .replace(/[()（）._\-/]/g, '');
}

function headersMatch(source: string, target: string) {
  const normalizedSource = normalizeHeader(source);
  const normalizedTarget = normalizeHeader(target);

  if (!normalizedSource || !normalizedTarget) {
    return false;
  }

  return (
    normalizedSource === normalizedTarget ||
    normalizedSource.startsWith(normalizedTarget) ||
    normalizedSource.includes(normalizedTarget)
  );
}

function readCell(row: SheetRow, keys: string[]) {
  const entries = Object.entries(row);

  for (const key of keys) {
    const value = row[key];
    const normalizedValue = stringifyCell(value);

    if (normalizedValue) {
      return normalizedValue;
    }

    for (const [rowKey, rowValue] of entries) {
      if (!headersMatch(rowKey, key)) {
        continue;
      }

      const matchedValue = stringifyCell(rowValue);

      if (matchedValue) {
        return matchedValue;
      }
    }
  }

  return '';
}

function normalizeSalesCount(value: string) {
  const normalizedValue = Number(value.replaceAll(',', ''));
  return Number.isFinite(normalizedValue) ? Math.max(0, Math.round(normalizedValue)) : 0;
}

function normalizeStatus(value: string): SheetRecordStatus {
  if (value.includes('미승인') || value.includes('기각') || value.includes('반려')) {
    return '미신청';
  }

  if (value.includes('차단완료') || value.includes('차단 완료') || value.includes('승인')) {
    return '차단완료';
  }

  if (
    value.includes('신고완료') ||
    value.includes('신고') ||
    value.includes('신청') ||
    value.includes('접수') ||
    value.includes('완료')
  ) {
    return '신고완료';
  }

  return '미신청';
}

function normalizeDate(value: unknown) {
  if (typeof value === 'number') {
    const parsedDate = XLSX.SSF.parse_date_code(value);

    if (parsedDate) {
      return `${parsedDate.y}-${String(parsedDate.m).padStart(2, '0')}-${String(parsedDate.d).padStart(2, '0')}`;
    }
  }

  const textValue = stringifyCell(value);

  if (!textValue) {
    return defaultSearchDate;
  }

  const normalizedText = textValue.replace(/[./]/g, '-').replace(/\s+/g, '');
  const match = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(normalizedText);

  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  return defaultSearchDate;
}

function readDateCell(row: SheetRow, keys: string[]) {
  const entries = Object.entries(row);

  for (const key of keys) {
    const value = row[key];

    if (stringifyCell(value)) {
      return normalizeDate(value);
    }

    for (const [rowKey, rowValue] of entries) {
      if (headersMatch(rowKey, key) && stringifyCell(rowValue)) {
        return normalizeDate(rowValue);
      }
    }
  }

  return defaultSearchDate;
}

function findHeaderRowIndex(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const normalizedCells = row.map((cell) => normalizeHeader(stringifyCell(cell))).filter(Boolean);
    const matchedHeaderCount = expectedHeaderNames.filter((headerName) => {
      const normalizedHeaderName = normalizeHeader(headerName);
      return normalizedCells.some((cell) => cell === normalizedHeaderName || cell.includes(normalizedHeaderName));
    }).length;

    return matchedHeaderCount >= 2;
  });
}

function createRowsFromWorksheet(worksheet: XLSX.WorkSheet): SheetRow[] {
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    blankrows: false,
    defval: '',
    header: 1,
  });
  const headerRowIndex = findHeaderRowIndex(rawRows);

  if (headerRowIndex < 0) {
    return XLSX.utils.sheet_to_json<SheetRow>(worksheet, { defval: '' });
  }

  const headers = rawRows[headerRowIndex].map((cell, index) => stringifyCell(cell) || `__EMPTY_${index}`);

  return rawRows
    .slice(headerRowIndex + 1)
    .map((row) =>
      headers.reduce<SheetRow>((sheetRow, header, index) => {
        sheetRow[header] = row[index] ?? '';
        return sheetRow;
      }, {})
    )
    .filter((row) => Object.values(row).some((cell) => stringifyCell(cell)));
}

export function parseSheetRecords(buffer: Buffer): CreateSheetRecordInput[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = createRowsFromWorksheet(worksheet);

  return rows
    .map((row) => {
      const category = readCell(row, ['카테고리', 'category', 'Category']);
      const platform = readCell(row, ['침해 플랫폼', '플랫폼', 'platform', 'Platform']) || category;
      const productName = readCell(row, [
        '제품명칭',
        '침해 제품명',
        '상품명',
        '제품명',
        'productName',
        'product_name',
        'name',
      ]);

      return {
        category,
        companyName: readCell(row, [
          '판매업체명칭',
          '판매 업체명칭',
          '침해 업체명칭',
          '침해 업체명',
          '업체명',
          'companyName',
          'company_name',
        ]),
        imageUrl: readCell(row, ['상품 이미지', '침해제품사진', '침해 제품사진', '이미지', 'imageUrl', 'image_url']),
        platform,
        price: readCell(row, ['판매가격￥', '판매가격', '판매가￥', '판매가', '가격', 'price']),
        productName,
        salesCount: normalizeSalesCount(readCell(row, ['판매량', '판매수량', '수량', 'salesCount', 'sales_count'])),
        salesUrl: readCell(row, [
          '침해제품링크주소',
          '침해 제품 링크 주소',
          '판매링크',
          '링크',
          'URL',
          'url',
          'salesUrl',
          'sales_url',
        ]),
        searchDate: readDateCell(row, ['검색 날짜', '검색날짜', '생성일', 'createdAt', 'created_at', 'searchDate', 'search_date']),
        status: normalizeStatus(readCell(row, ['차단 여부 확인', '차단 신고 승인', '차단 신고', '진행 상황', '상태값', '상태', 'status'])),
      };
    })
    .filter((record) => record.productName || record.salesUrl || record.companyName);
}
