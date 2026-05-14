import { isLocalAuthBypassEnabled } from '@/lib/auth/local-bypass';
import type { UserSessionUser } from '@/lib/auth/user';
import { getSheetRecords, getSheetSummaries } from '@/lib/admin/sheets';
import { createServerDatabaseClient } from '@/lib/supabase/database';
import type { SheetRecord, SheetSummary } from '@/types/sheet';

export const productHistoryPageSize = 20;

export type ProductHistoryStatus = '미신청' | '신고완료' | '차단완료';

export type UserProduct = string;

export type UserProductSummary = {
  id: string;
  name: string;
  recordCount: number;
};

export type ProductHistoryItem = {
  blockApproval: string;
  blockObjection: string;
  blockObjectionDecision: string;
  blockObjectionReason: string;
  blockReapproval: string;
  blockRejectionReason: string;
  blockReport: string;
  blockRereport: string;
  blockRereportRejectionReason: string;
  blockRequested: boolean;
  companyName: string;
  displayDate: string;
  id: string;
  imageUrl: string;
  platform: string;
  price: string;
  product: string;
  productName: string;
  salesCount: number;
  salesUrl: string;
  searchDate: string;
  sheetId: string;
  status: ProductHistoryStatus;
};

type CustomerIdRow = {
  customer_id?: string | null;
  id?: string | null;
};

function mapProductSummary(sheet: SheetSummary): UserProductSummary {
  return {
    id: sheet.id,
    name: sheet.name,
    recordCount: sheet.recordCount,
  };
}

function mapSheetRecordToHistoryItem(record: SheetRecord, productName: string): ProductHistoryItem {
  const status = record.status || '미신청';

  return {
    blockApproval: record.blockApproval || (status === '차단완료' ? '승인 완료' : '-'),
    blockObjection: record.blockObjection || '-',
    blockObjectionDecision: record.blockObjectionDecision || '-',
    blockObjectionReason: record.blockObjectionReason || '-',
    blockReapproval: record.blockReapproval || '-',
    blockRejectionReason: record.blockRejectionReason || '-',
    blockReport: record.blockReport || (status === '미신청' ? '-' : '신고 완료'),
    blockRereport: record.blockRereport || '-',
    blockRereportRejectionReason: record.blockRereportRejectionReason || '-',
    blockRequested: status !== '미신청',
    companyName: record.companyName,
    displayDate: record.displayDate || '날짜 없음',
    id: record.id,
    imageUrl: record.imageUrl,
    platform: record.platform || record.category,
    price: record.price,
    product: productName,
    productName: record.productName,
    salesCount: record.salesCount,
    salesUrl: record.salesUrl,
    searchDate: record.searchDate,
    sheetId: record.sheetId,
    status,
  };
}

async function getAllUserProductSummaries() {
  const sheets = await getSheetSummaries();

  return sheets.map(mapProductSummary);
}

async function getUserCustomerId(user: UserSessionUser) {
  const supabase = createServerDatabaseClient();
  const email = user.email.trim().toLowerCase();

  if (!email) {
    return null;
  }

  const { data: customerUser, error: customerUserError } = await supabase
    .from('customer_users')
    .select('customer_id')
    .eq('email', email)
    .is('deleted_at', null)
    .maybeSingle();

  if (customerUserError) {
    throw new Error(customerUserError.message);
  }

  if (customerUser) {
    return (customerUser as CustomerIdRow).customer_id ?? null;
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('primary_email', email)
    .is('deleted_at', null)
    .maybeSingle();

  if (customerError) {
    throw new Error(customerError.message);
  }

  return customer ? ((customer as CustomerIdRow).id ?? null) : null;
}

export async function getScopedUserProductSummaries(user: UserSessionUser) {
  if (isLocalAuthBypassEnabled() && user.id === 'local-dev-user') {
    return getAllUserProductSummaries();
  }

  const customerId = await getUserCustomerId(user);

  if (!customerId) {
    return [];
  }

  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheets')
    .select('id,name,original_file_name,record_count,created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{
    created_at: string | null;
    id: string;
    name: string | null;
    original_file_name: string | null;
    record_count: number | null;
  }>).map((row) => ({
    id: row.id,
    name: row.name ?? '업로드 시트',
    recordCount: row.record_count ?? 0,
  }));
}

export function getProductFromParam(value: string | string[] | undefined, products: UserProductSummary[]): UserProduct {
  const paramValue = Array.isArray(value) ? value[0] : value;

  if (paramValue && products.some((product) => product.id === paramValue)) {
    return paramValue;
  }

  return products[0]?.id ?? '';
}

export function getProductLabel(product: UserProduct, products: UserProductSummary[]) {
  return products.find((productSummary) => productSummary.id === product)?.name ?? product;
}

export async function getProductHistoryItems(product: UserProduct, products?: UserProductSummary[]) {
  if (!product) {
    return [];
  }

  if (products && !products.some((productSummary) => productSummary.id === product)) {
    return [];
  }

  const productName = products ? getProductLabel(product, products) : product;
  const records = await getSheetRecords(product);

  return records.map((record) => mapSheetRecordToHistoryItem(record, productName));
}

export async function getProductHistoryItem(product: UserProduct, itemId: string | string[] | undefined, products?: UserProductSummary[]) {
  const normalizedItemId = Array.isArray(itemId) ? itemId[0] : itemId;

  if (!product || !normalizedItemId) {
    return null;
  }

  const items = await getProductHistoryItems(product, products);

  return items.find((item) => item.id === normalizedItemId) ?? null;
}

export function filterProductHistoryItems(items: ProductHistoryItem[], startDate: string, endDate: string) {
  const normalizedStartDate = startDate <= endDate ? startDate : endDate;
  const normalizedEndDate = startDate <= endDate ? endDate : startDate;

  return items.filter((item) => {
    if (!item.searchDate) {
      return true;
    }

    return item.searchDate >= normalizedStartDate && item.searchDate <= normalizedEndDate;
  });
}
