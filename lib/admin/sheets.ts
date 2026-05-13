import type { SupabaseClient } from '@supabase/supabase-js';

import { createServerDatabaseClient } from '@/lib/supabase/database';
import type { SheetRecord, SheetRecordStatus, SheetSummary } from '@/types/sheet';

type SheetUploadRow = {
  created_at: string | null;
  id: string;
  name: string | null;
  original_file_name: string | null;
  record_count: number | null;
};

type SheetRecordRow = {
  category: string | null;
  company_name: string | null;
  created_at: string | null;
  id: string;
  image_url: string | null;
  platform: string | null;
  price: string | null;
  product_name: string | null;
  sales_count: number | null;
  sales_url: string | null;
  search_date: string | null;
  sheet_id: string | null;
  status: string | null;
};

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

function mapSheetSummary(row: SheetUploadRow): SheetSummary {
  return {
    createdAt: row.created_at ?? '',
    id: row.id,
    name: row.name ?? '업로드 시트',
    originalFileName: row.original_file_name ?? '',
    recordCount: row.record_count ?? 0,
  };
}

function mapSheetRecord(row: SheetRecordRow): SheetRecord {
  const searchDate = row.search_date ?? '';

  return {
    category: row.category ?? '',
    companyName: row.company_name ?? '',
    createdAt: row.created_at ?? '',
    displayDate: formatDisplayDate(searchDate),
    id: row.id,
    imageUrl: row.image_url ?? '',
    platform: row.platform ?? row.category ?? '',
    price: row.price ?? '',
    productName: row.product_name ?? '',
    salesCount: row.sales_count ?? 0,
    salesUrl: row.sales_url ?? '',
    searchDate,
    sheetId: row.sheet_id ?? '',
    status: normalizeSheetRecordStatus(row.status),
  };
}

export async function getSheetSummaries(client?: SupabaseClient) {
  const supabase = client ?? createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheet_uploads')
    .select('id,name,original_file_name,record_count,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SheetUploadRow[]).map(mapSheetSummary);
}

export async function getSheetSummaryById(id: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheet_uploads')
    .select('id,name,original_file_name,record_count,created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapSheetSummary(data as SheetUploadRow) : null;
}

export async function getSheetRecords(sheetId: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheet_records')
    .select(
      'id,sheet_id,image_url,product_name,sales_url,category,platform,company_name,price,sales_count,status,search_date,created_at'
    )
    .eq('sheet_id', sheetId)
    .order('row_index', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as SheetRecordRow[]).map(mapSheetRecord);
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
  const { data: sheetData, error: sheetError } = await supabase
    .from('sheet_uploads')
    .insert({
      name,
      original_file_name: originalFileName,
      record_count: records.length,
    })
    .select('id,name,original_file_name,record_count,created_at')
    .single();

  if (sheetError) {
    throw new Error(sheetError.message);
  }

  const sheet = mapSheetSummary(sheetData as SheetUploadRow);

  if (records.length > 0) {
    const { error: recordsError } = await supabase.from('sheet_records').insert(
      records.map((record, index) => ({
        category: record.category,
        company_name: record.companyName,
        image_url: record.imageUrl,
        platform: record.platform,
        price: record.price,
        product_name: record.productName,
        row_index: index + 1,
        sales_count: record.salesCount,
        sales_url: record.salesUrl,
        search_date: record.searchDate,
        sheet_id: sheet.id,
        status: record.status,
      }))
    );

    if (recordsError) {
      throw new Error(recordsError.message);
    }
  }

  return sheet;
}
