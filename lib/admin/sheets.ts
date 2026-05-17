import type { SupabaseClient } from '@supabase/supabase-js';

import { createServerDatabaseClient } from '@/lib/supabase/database';
import type { SheetRecord, SheetRecordStatus, SheetSummary } from '@/types/sheet';

type SheetUploadRow = {
  created_at: string | null;
  customer_id: string | null;
  id: string;
  name: string | null;
  original_file_name: string | null;
  record_count: number | null;
};

type CustomerOwnerRow = {
  company_name: string | null;
  id: string;
  primary_email: string | null;
};

type SheetRecordRow = {
  block_report_approval_text: string | null;
  block_report_rejection_reason: string | null;
  block_report_text: string | null;
  block_rereport_approval_text: string | null;
  block_rereport_rejection_reason: string | null;
  block_rereport_text: string | null;
  block_status_text: string | null;
  created_at: string | null;
  id: string;
  infringing_product_image_url: string | null;
  infringing_product_url: string | null;
  opposition_approval_reason: string | null;
  opposition_approval_text: string | null;
  opposition_rejection_reason: string | null;
  opposition_text: string | null;
  platform: string | null;
  price_raw: string | null;
  product_name: string | null;
  row_index: number | null;
  sales_count: number | null;
  search_date: string | null;
  seller_name: string | null;
  sheet_id: string | null;
};

const sheetRecordSelectColumns = [
  'id',
  'sheet_id',
  'infringing_product_image_url',
  'product_name',
  'infringing_product_url',
  'platform',
  'seller_name',
  'price_raw',
  'sales_count',
  'row_index',
  'block_status_text',
  'block_report_text',
  'block_report_approval_text',
  'block_report_rejection_reason',
  'opposition_text',
  'opposition_approval_text',
  'opposition_approval_reason',
  'opposition_rejection_reason',
  'block_rereport_text',
  'block_rereport_approval_text',
  'block_rereport_rejection_reason',
  'search_date',
  'created_at',
].join(',');
const sheetRecordFetchBatchSize = 1000;

export type CreateSheetRecordInput = {
  category: string;
  companyName: string;
  imageUrl: string;
  platform: string;
  price: string;
  productName: string;
  salesCount: number;
  salesUrl: string;
  searchDate: string;
  status: SheetRecordStatus;
};

export type CreateSingleSheetRecordInput = CreateSheetRecordInput;

type SheetUploadTransactionRecord = CreateSheetRecordInput & {
  rowIndex: number;
};

export type UpdateSheetRecordInput = {
  blockApproval: string;
  blockObjection: string;
  blockObjectionDecision: string;
  blockObjectionReason: string;
  blockReapproval: string;
  blockRejectionReason: string;
  blockReport: string;
  blockRereport: string;
  blockRereportRejectionReason: string;
  blockStatus: SheetRecordStatus;
};

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${year.slice(2)}. ${month}. ${day}`;
}

function normalizeSheetRecordStatus(value: string | null): SheetRecordStatus {
  if (value === '신고완료' || value === '차단완료') {
    return value;
  }

  return '미신청';
}

function getUnmatchedSheetRetentionDays() {
  const parsedDays = Number(process.env.UNMATCHED_SHEET_RETENTION_DAYS ?? '14');

  return Number.isInteger(parsedDays) && parsedDays > 0 ? Math.min(parsedDays, 14) : 14;
}

function getDeletionSchedule(createdAt: string | null, customerId: string | null) {
  const retentionDays = getUnmatchedSheetRetentionDays();

  if (customerId || !createdAt) {
    return {
      deletionScheduledAt: '',
      deletionStatusLabel: '매칭 완료',
      daysUntilDeletion: 0,
      isMatched: Boolean(customerId),
      retentionDays,
    };
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return {
      deletionScheduledAt: '',
      deletionStatusLabel: `${retentionDays}일 뒤 삭제 예정`,
      daysUntilDeletion: retentionDays,
      isMatched: false,
      retentionDays,
    };
  }

  const deletionDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysUntilDeletion = Math.max(0, Math.ceil((deletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  return {
    deletionScheduledAt: deletionDate.toISOString(),
    deletionStatusLabel: daysUntilDeletion > 0 ? `${daysUntilDeletion}일 뒤 삭제 예정` : '삭제 대상',
    daysUntilDeletion,
    isMatched: false,
    retentionDays,
  };
}

async function getCustomerOwnerMap(supabase: SupabaseClient, customerIds: string[]) {
  const uniqueCustomerIds = Array.from(new Set(customerIds.filter(Boolean)));

  if (uniqueCustomerIds.length === 0) {
    return new Map<string, CustomerOwnerRow>();
  }

  const { data, error } = await supabase.from('customers').select('id,company_name,primary_email').in('id', uniqueCustomerIds);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(((data ?? []) as CustomerOwnerRow[]).map((customer) => [customer.id, customer]));
}

function mapSheetSummary(row: SheetUploadRow, customerOwnerMap = new Map<string, CustomerOwnerRow>()): SheetSummary {
  const deletionSchedule = getDeletionSchedule(row.created_at, row.customer_id);
  const customerOwner = row.customer_id ? customerOwnerMap.get(row.customer_id) : undefined;

  return {
    createdAt: row.created_at ?? '',
    customerEmail: customerOwner?.primary_email ?? '',
    customerId: row.customer_id ?? '',
    customerName: customerOwner?.company_name ?? '',
    deletionScheduledAt: deletionSchedule.deletionScheduledAt,
    deletionStatusLabel: deletionSchedule.deletionStatusLabel,
    daysUntilDeletion: deletionSchedule.daysUntilDeletion,
    id: row.id,
    isMatched: deletionSchedule.isMatched,
    name: row.name ?? '업로드 시트',
    originalFileName: row.original_file_name ?? '',
    recordCount: row.record_count ?? 0,
    retentionDays: deletionSchedule.retentionDays,
  };
}

function mapSheetRecord(row: SheetRecordRow): SheetRecord {
  const searchDate = row.search_date ?? '';

  return {
    blockApproval: row.block_report_approval_text ?? '',
    blockObjection: row.opposition_text ?? '',
    blockObjectionDecision: row.opposition_approval_text ?? '',
    blockObjectionReason: row.opposition_approval_reason ?? row.opposition_rejection_reason ?? '',
    blockReapproval: row.block_rereport_approval_text ?? '',
    blockRejectionReason: row.block_report_rejection_reason ?? '',
    blockReport: row.block_report_text ?? '',
    blockRereport: row.block_rereport_text ?? '',
    blockRereportRejectionReason: row.block_rereport_rejection_reason ?? '',
    category: row.platform ?? '',
    companyName: row.seller_name ?? '',
    createdAt: row.created_at ?? '',
    displayDate: formatDisplayDate(searchDate) || '날짜 없음',
    id: row.id,
    imageUrl: row.infringing_product_image_url ?? '',
    platform: row.platform ?? '',
    price: row.price_raw ?? '',
    productName: row.product_name ?? '',
    rowIndex: row.row_index ?? 0,
    salesCount: row.sales_count ?? 0,
    salesUrl: row.infringing_product_url ?? '',
    searchDate,
    sheetId: row.sheet_id ?? '',
    status: normalizeSheetRecordStatus(row.block_status_text),
  };
}

function normalizeSheetUploadTransactionError(message: string) {
  if (message.includes('SHEET_NAME_ALREADY_EXISTS')) {
    return 'SHEET_NAME_ALREADY_EXISTS';
  }

  if (message.includes('EMPTY_SHEET')) {
    return 'EMPTY_SHEET';
  }

  if (message.includes('SHEET_RECORDS_REQUIRED')) {
    return 'EMPTY_SHEET';
  }

  if (message.includes('SHEET_NAME_REQUIRED')) {
    return 'SHEET_NAME_REQUIRED';
  }

  return message;
}

export async function getSheetSummaries(client?: SupabaseClient) {
  const supabase = client ?? createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheets')
    .select('id,customer_id,name,original_file_name,record_count,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as SheetUploadRow[];
  const customerOwnerMap = await getCustomerOwnerMap(
    supabase,
    rows.map((row) => row.customer_id ?? '')
  );

  return rows.map((row) => mapSheetSummary(row, customerOwnerMap));
}

export async function getSheetSummaryById(id: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheets')
    .select('id,customer_id,name,original_file_name,record_count,created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as SheetUploadRow;
  const customerOwnerMap = await getCustomerOwnerMap(supabase, [row.customer_id ?? '']);

  return mapSheetSummary(row, customerOwnerMap);
}

export async function deleteSheet(sheetId: string) {
  const supabase = createServerDatabaseClient();
  const { data: sheet, error: sheetLookupError } = await supabase
    .from('sheets')
    .select('id,customer_id')
    .eq('id', sheetId)
    .maybeSingle();

  if (sheetLookupError) {
    throw new Error(sheetLookupError.message);
  }

  if (!sheet) {
    throw new Error('SHEET_NOT_FOUND');
  }

  if ((sheet as { customer_id: string | null }).customer_id) {
    throw new Error('SHEET_ASSIGNED_TO_CUSTOMER');
  }

  const { error } = await supabase.from('sheets').delete().eq('id', sheetId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    deleted: true,
  };
}

export async function deleteExpiredUnmatchedSheets() {
  const supabase = createServerDatabaseClient();
  const retentionDays = getUnmatchedSheetRetentionDays();
  const deleteBefore = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('sheets')
    .delete()
    .is('customer_id', null)
    .lte('created_at', deleteBefore)
    .select('id');

  if (error) {
    throw new Error(error.message);
  }

  return {
    deletedCount: data?.length ?? 0,
    retentionDays,
  };
}

export async function getSheetRecordById(sheetId: string, recordId: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheet_records')
    .select(sheetRecordSelectColumns)
    .eq('sheet_id', sheetId)
    .eq('id', recordId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSheetRecord(data as unknown as SheetRecordRow) : null;
}

export async function createSheetRecord(sheetId: string, input: CreateSingleSheetRecordInput) {
  const supabase = createServerDatabaseClient();
  const { data: sheetData, error: sheetLookupError } = await supabase.from('sheets').select('id,customer_id').eq('id', sheetId).maybeSingle();

  if (sheetLookupError) {
    throw new Error(sheetLookupError.message);
  }

  if (!sheetData) {
    throw new Error('SHEET_NOT_FOUND');
  }

  const sheetRow = sheetData as { customer_id: string | null; id: string };
  const { data: lastRecordData, error: lastRecordError } = await supabase
    .from('sheet_records')
    .select('row_index')
    .eq('sheet_id', sheetId)
    .order('row_index', { ascending: false })
    .limit(1);

  if (lastRecordError) {
    throw new Error(lastRecordError.message);
  }

  const lastRecordRows = (lastRecordData ?? []) as Array<{ row_index: number | null }>;
  const nextRowIndex = (lastRecordRows[0]?.row_index ?? 0) + 1;
  const { data, error } = await supabase
    .from('sheet_records')
    .insert({
      block_status_text: input.status,
      customer_id: sheetRow.customer_id,
      infringing_product_image_url: input.imageUrl,
      infringing_product_url: input.salesUrl,
      platform: input.platform || input.category,
      price_raw: input.price,
      product_name: input.productName,
      raw_record: input,
      row_index: nextRowIndex,
      sales_count: input.salesCount,
      search_date: input.searchDate || null,
      seller_name: input.companyName,
      sheet_id: sheetId,
    })
    .select(sheetRecordSelectColumns)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { count, error: countError } = await supabase
    .from('sheet_records')
    .select('id', { count: 'exact', head: true })
    .eq('sheet_id', sheetId);

  if (countError) {
    throw new Error(countError.message);
  }

  const { error: sheetUpdateError } = await supabase.from('sheets').update({ record_count: count ?? nextRowIndex }).eq('id', sheetId);

  if (sheetUpdateError) {
    throw new Error(sheetUpdateError.message);
  }

  return mapSheetRecord(data as unknown as SheetRecordRow);
}

export async function updateSheetRecord(sheetId: string, recordId: string, input: UpdateSheetRecordInput) {
  const supabase = createServerDatabaseClient();
  const { error } = await supabase
    .from('sheet_records')
    .update({
      block_report_approval_text: input.blockApproval,
      block_report_rejection_reason: input.blockRejectionReason,
      block_report_text: input.blockReport,
      block_rereport_approval_text: input.blockReapproval,
      block_rereport_rejection_reason: input.blockRereportRejectionReason,
      block_rereport_text: input.blockRereport,
      block_status_text: input.blockStatus,
      opposition_approval_reason: input.blockObjectionReason,
      opposition_approval_text: input.blockObjectionDecision,
      opposition_text: input.blockObjection,
    })
    .eq('sheet_id', sheetId)
    .eq('id', recordId);

  if (error) {
    throw new Error(error.message);
  }

  return getSheetRecordById(sheetId, recordId);
}

export async function getSheetRecords(sheetId: string) {
  const supabase = createServerDatabaseClient();
  const rows: SheetRecordRow[] = [];
  let from = 0;

  while (true) {
    const to = from + sheetRecordFetchBatchSize - 1;
    const { data, error } = await supabase
      .from('sheet_records')
      .select(sheetRecordSelectColumns)
      .eq('sheet_id', sheetId)
      .order('row_index', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const batchRows = (data ?? []) as unknown as SheetRecordRow[];
    rows.push(...batchRows);

    if (batchRows.length < sheetRecordFetchBatchSize) {
      break;
    }

    from += sheetRecordFetchBatchSize;
  }

  return rows.map(mapSheetRecord);
}

export async function createSheetUpload({
  name,
  originalFileName,
  records,
}: {
  name: string;
  originalFileName: string;
  records: CreateSheetRecordInput[];
}) {
  const supabase = createServerDatabaseClient();
  const normalizedName = name.trim();
  const transactionRecords = records.map((record, index): SheetUploadTransactionRecord => ({
    ...record,
    rowIndex: index + 1,
  }));
  const { data, error } = await supabase.rpc('create_sheet_upload_transaction', {
    p_name: normalizedName,
    p_original_file_name: originalFileName,
    p_records: transactionRecords,
  });

  if (error) {
    throw new Error(normalizeSheetUploadTransactionError(error.message));
  }

  const sheetData = ((data ?? []) as unknown as SheetUploadRow[])[0];

  if (!sheetData) {
    throw new Error('SHEET_UPLOAD_TRANSACTION_EMPTY_RESULT');
  }

  return mapSheetSummary(sheetData);
}
