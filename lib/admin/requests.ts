import { createServerDatabaseClient } from '@/lib/supabase/database';
import type { ProductHistoryItem } from '@/lib/user/productHistory';
import type { AdminRequest, AdminRequestStatus } from '@/types/adminRequest';

type AdminRequestRow = {
  admin_note: string | null;
  created_at: string | null;
  customer_id: string | null;
  customer_user_id: string | null;
  id: string;
  platform: string | null;
  product: string | null;
  product_name: string | null;
  request_type: string | null;
  sales_url: string | null;
  sheet_id: string | null;
  sheet_record_id: string | null;
  seller_name: string | null;
  status: string | null;
  user_message: string | null;
};

type SheetRecordDetailRow = {
  block_report_approval_text: string | null;
  block_report_rejection_reason: string | null;
  block_report_text: string | null;
  block_rereport_approval_text: string | null;
  block_rereport_rejection_reason: string | null;
  block_rereport_text: string | null;
  block_status_text: string | null;
  customer_id: string | null;
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
  sales_count: number | null;
  search_date: string | null;
  seller_name: string | null;
  sheet_id: string | null;
};

export type UpdateAdminRequestInput = {
  blockApproval: string;
  blockObjection: string;
  blockObjectionDecision: string;
  blockObjectionReason: string;
  blockReapproval: string;
  blockRejectionReason: string;
  blockReport: string;
  blockRereport: string;
  blockRereportRejectionReason: string;
  blockStatus: string;
  status: AdminRequestStatus;
};

type CustomerIdRow = {
  id: string;
};

type AdminNotePayload = {
  detail?: Partial<Pick<
    AdminRequest,
    | 'blockApproval'
    | 'blockObjection'
    | 'blockObjectionDecision'
    | 'blockObjectionReason'
    | 'blockReapproval'
    | 'blockRejectionReason'
    | 'blockReport'
    | 'blockRereport'
    | 'blockRereportRejectionReason'
    | 'blockStatus'
    | 'imageUrl'
    | 'itemId'
    | 'price'
    | 'salesCount'
    | 'searchDate'
  >>;
  userId?: string;
};

type CreateAdminRequestInput = {
  item: ProductHistoryItem;
  product: string;
  userEmail: string;
  userId: string;
};

function normalizeRequestStatus(value: string | null): AdminRequestStatus {
  if (value === 'in_progress') {
    return '처리중';
  }

  if (value === 'done') {
    return '처리완료';
  }

  if (value === 'rejected') {
    return '반려';
  }

  if (value === '처리중' || value === '처리완료') {
    return value;
  }

  return '신규요청';
}

function denormalizeRequestStatus(value: AdminRequestStatus) {
  if (value === '처리중') {
    return 'in_progress';
  }

  if (value === '처리완료') {
    return 'done';
  }

  if (value === '반려') {
    return 'rejected';
  }

  return 'new';
}

function parseAdminNote(value: string | null): AdminNotePayload {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        userId: value,
      };
    }

    const payload = parsed as Record<string, unknown>;
    const detail = payload.detail && typeof payload.detail === 'object' && !Array.isArray(payload.detail)
      ? (payload.detail as AdminNotePayload['detail'])
      : undefined;
    const userId = typeof payload.userId === 'string' ? payload.userId : undefined;

    return {
      detail,
      userId,
    };
  } catch {
    return {
      userId: value,
    };
  }
}

function buildAdminNotePayload(userId: string, detail: AdminNotePayload['detail']) {
  return JSON.stringify({
    detail,
    userId,
  } satisfies AdminNotePayload);
}

function mapAdminRequest(row: AdminRequestRow, sheetRecord?: SheetRecordDetailRow | null): AdminRequest {
  const note = parseAdminNote(row.admin_note);
  const noteDetail = note.detail;

  return {
    blockApproval: sheetRecord?.block_report_approval_text ?? noteDetail?.blockApproval ?? '-',
    blockObjection: sheetRecord?.opposition_text ?? noteDetail?.blockObjection ?? '-',
    blockObjectionDecision:
      sheetRecord?.opposition_approval_text ?? noteDetail?.blockObjectionDecision ?? '-',
    blockObjectionReason:
      sheetRecord?.opposition_approval_reason ??
      sheetRecord?.opposition_rejection_reason ??
      noteDetail?.blockObjectionReason ??
      '-',
    blockReapproval: sheetRecord?.block_rereport_approval_text ?? noteDetail?.blockReapproval ?? '-',
    blockRejectionReason:
      sheetRecord?.block_report_rejection_reason ??
      noteDetail?.blockRejectionReason ??
      '-',
    blockReport: sheetRecord?.block_report_text ?? noteDetail?.blockReport ?? '-',
    blockRereport: sheetRecord?.block_rereport_text ?? noteDetail?.blockRereport ?? '-',
    blockRereportRejectionReason:
      sheetRecord?.block_rereport_rejection_reason ??
      noteDetail?.blockRereportRejectionReason ??
      '-',
    blockStatus: sheetRecord?.block_status_text || noteDetail?.blockStatus || '미신청',
    companyName: sheetRecord?.seller_name ?? row.seller_name ?? '',
    createdAt: row.created_at ?? '',
    id: row.id,
    imageUrl: sheetRecord?.infringing_product_image_url ?? noteDetail?.imageUrl ?? '',
    itemId: row.sheet_record_id ?? noteDetail?.itemId ?? '',
    message: row.user_message ?? row.admin_note ?? '',
    platform: sheetRecord?.platform ?? row.platform ?? '',
    price: sheetRecord?.price_raw ?? noteDetail?.price ?? '',
    product: row.product ?? '',
    productName: sheetRecord?.product_name ?? row.product_name ?? '',
    requestType: row.request_type ?? '차단 신청',
    salesCount: sheetRecord?.sales_count ?? noteDetail?.salesCount ?? 0,
    salesUrl: sheetRecord?.infringing_product_url ?? row.sales_url ?? '',
    searchDate: sheetRecord?.search_date ?? noteDetail?.searchDate ?? '',
    sheetId: sheetRecord?.sheet_id ?? row.sheet_id ?? '',
    sheetRecordId: row.sheet_record_id ?? sheetRecord?.id ?? '',
    status: normalizeRequestStatus(row.status),
    userEmail: row.user_message ?? '',
    userId: note.userId ?? row.customer_user_id ?? row.customer_id ?? '',
  };
}

async function getSheetRecordDetail(id: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheet_records')
    .select(
      [
        'id',
        'sheet_id',
        'customer_id',
        'search_date',
        'infringing_product_image_url',
        'platform',
        'product_name',
        'seller_name',
        'price_raw',
        'sales_count',
        'infringing_product_url',
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
      ].join(',')
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? (data as unknown as SheetRecordDetailRow) : null;
}

async function getOrCreateRequestCustomer(userEmail: string) {
  const supabase = createServerDatabaseClient();
  const normalizedEmail = userEmail.trim().toLowerCase() || 'local-dev-user@lifang.local';
  const { data: existingCustomer, error: selectError } = await supabase
    .from('customers')
    .select('id')
    .eq('primary_email', normalizedEmail)
    .is('deleted_at', null)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existingCustomer) {
    return (existingCustomer as CustomerIdRow).id;
  }

  const { data: createdCustomer, error: insertError } = await supabase
    .from('customers')
    .insert({
      company_name: '미지정 고객사',
      manager_name: '',
      primary_email: normalizedEmail,
    })
    .select('id')
    .single();

  if (!insertError && createdCustomer) {
    return (createdCustomer as CustomerIdRow).id;
  }

  const { data: racedCustomer, error: racedSelectError } = await supabase
    .from('customers')
    .select('id')
    .eq('primary_email', normalizedEmail)
    .is('deleted_at', null)
    .maybeSingle();

  if (racedSelectError || !racedCustomer) {
    throw new Error(insertError?.message ?? racedSelectError?.message ?? '고객사 정보를 생성할 수 없습니다.');
  }

  return (racedCustomer as CustomerIdRow).id;
}

export async function getAdminRequests() {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('admin_requests')
    .select(
      'id,customer_id,customer_user_id,sheet_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminRequestRow[]).map((row) => mapAdminRequest(row));
}

export async function getAdminRequestById(id: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('admin_requests')
    .select(
      'id,customer_id,customer_user_id,sheet_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as AdminRequestRow;
  const sheetRecord = row.sheet_record_id ? await getSheetRecordDetail(row.sheet_record_id) : null;

  return mapAdminRequest(row, sheetRecord);
}

export async function createAdminRequest({ item, product, userEmail, userId }: CreateAdminRequestInput) {
  const supabase = createServerDatabaseClient();
  const customerId = await getOrCreateRequestCustomer(userEmail);
  const adminNote = buildAdminNotePayload(userId, {
    blockApproval: item.blockApproval,
    blockObjection: item.blockObjection,
    blockObjectionDecision: item.blockObjectionDecision,
    blockObjectionReason: item.blockObjectionReason,
    blockReapproval: item.blockReapproval,
    blockRejectionReason: item.blockRejectionReason,
    blockReport: item.blockReport,
    blockRereport: item.blockRereport,
    blockRereportRejectionReason: item.blockRereportRejectionReason,
    blockStatus: item.status,
    imageUrl: item.imageUrl,
    itemId: item.id,
    price: item.price,
    salesCount: item.salesCount,
    searchDate: item.searchDate,
  });
  const { data, error } = await supabase
    .from('admin_requests')
    .insert({
      admin_note: adminNote,
      customer_id: customerId,
      customer_user_id: null,
      sheet_id: item.sheetId || null,
      sheet_record_id: item.id,
      platform: item.platform,
      product,
      product_name: item.productName,
      request_type: 'block_request',
      sales_url: item.salesUrl,
      seller_name: item.companyName,
      status: 'new',
      user_message: userEmail,
    })
    .select(
      'id,customer_id,customer_user_id,sheet_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAdminRequest(data as AdminRequestRow);
}

export async function updateAdminRequest(id: string, input: UpdateAdminRequestInput) {
  const supabase = createServerDatabaseClient();
  const { data: requestData, error: requestSelectError } = await supabase
    .from('admin_requests')
    .select(
      'id,customer_id,customer_user_id,sheet_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (requestSelectError) {
    throw new Error(requestSelectError.message);
  }

  if (!requestData) {
    return null;
  }

  const requestRow = requestData as AdminRequestRow;
  const dbStatus = denormalizeRequestStatus(input.status);
  const { error: requestUpdateError } = await supabase
    .from('admin_requests')
    .update({
      processed_at: dbStatus === 'done' || dbStatus === 'rejected' ? new Date().toISOString() : null,
      status: dbStatus,
    })
    .eq('id', id);

  if (requestUpdateError) {
    throw new Error(requestUpdateError.message);
  }

  if (requestRow.sheet_record_id) {
    const { error: sheetRecordUpdateError } = await supabase
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
      .eq('id', requestRow.sheet_record_id);

    if (sheetRecordUpdateError) {
      throw new Error(sheetRecordUpdateError.message);
    }
  } else {
    const note = parseAdminNote(requestRow.admin_note);
    const { error: noteUpdateError } = await supabase
      .from('admin_requests')
      .update({
        admin_note: buildAdminNotePayload(note.userId ?? requestRow.customer_user_id ?? requestRow.customer_id ?? '', {
          ...(note.detail ?? {}),
          blockApproval: input.blockApproval,
          blockObjection: input.blockObjection,
          blockObjectionDecision: input.blockObjectionDecision,
          blockObjectionReason: input.blockObjectionReason,
          blockReapproval: input.blockReapproval,
          blockRejectionReason: input.blockRejectionReason,
          blockReport: input.blockReport,
          blockRereport: input.blockRereport,
          blockRereportRejectionReason: input.blockRereportRejectionReason,
          blockStatus: input.blockStatus,
        }),
      })
      .eq('id', id);

    if (noteUpdateError) {
      throw new Error(noteUpdateError.message);
    }
  }

  return getAdminRequestById(id);
}
