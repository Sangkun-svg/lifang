import * as XLSX from 'xlsx';

import type { CreateSheetRecordInput } from '@/lib/admin/sheets';
import type { SheetRecordStatus } from '@/types/sheet';

type SheetRow = Record<string, unknown>;

const defaultSearchDate = '2026-04-02';

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function readCell(row: SheetRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    const normalizedValue = stringifyCell(value);

    if (normalizedValue) {
      return normalizedValue;
    }
  }

  return '';
}

function normalizeSalesCount(value: string) {
  const normalizedValue = Number(value.replaceAll(',', ''));
  return Number.isFinite(normalizedValue) ? Math.max(0, Math.round(normalizedValue)) : 0;
}

function normalizeStatus(value: string): SheetRecordStatus {
  if (value.includes('차단완료')) {
    return '차단완료';
  }

  if (value.includes('신고완료') || value.includes('신청')) {
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
  for (const key of keys) {
    const value = row[key];

    if (stringifyCell(value)) {
      return normalizeDate(value);
    }
  }

  return defaultSearchDate;
}

export function parseSheetRecords(buffer: Buffer): CreateSheetRecordInput[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, { defval: '' });

  return rows
    .map((row) => {
      const category = readCell(row, ['카테고리', 'category', 'Category']);
      const platform = readCell(row, ['침해 플랫폼', '플랫폼', 'platform', 'Platform']) || category;
      const productName = readCell(row, ['침해 제품명', '상품명', '제품명', 'productName', 'product_name', 'name']);

      return {
        category,
        companyName: readCell(row, ['침해 업체명칭', '침해 업체명', '업체명', 'companyName', 'company_name']),
        imageUrl: readCell(row, ['상품 이미지', '침해 제품사진', '이미지', 'imageUrl', 'image_url']),
        platform,
        price: readCell(row, ['판매가￥', '판매가', '가격', 'price']),
        productName,
        salesCount: normalizeSalesCount(readCell(row, ['판매수량', '수량', 'salesCount', 'sales_count'])),
        salesUrl: readCell(row, ['판매링크', '링크', 'URL', 'url', 'salesUrl', 'sales_url']),
        searchDate: readDateCell(row, ['검색 날짜', '검색날짜', '생성일', 'createdAt', 'created_at', 'searchDate', 'search_date']),
        status: normalizeStatus(readCell(row, ['진행 상황', '상태값', '상태', 'status'])),
      };
    })
    .filter((record) => record.productName || record.salesUrl || record.companyName);
}
