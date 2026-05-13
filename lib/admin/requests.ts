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
  sheet_record_id: string | null;
  seller_name: string | null;
  status: string | null;
  user_message: string | null;
};

type CustomerIdRow = {
  id: string;
};

type CreateAdminRequestInput = {
  item: ProductHistoryItem;
  product: string;
  userEmail: string;
  userId: string;
};

export const demoAdminRequest: AdminRequest = {
  companyName: '汕头市澄海区宝比迪玩具有限公司',
  createdAt: '2026-05-13T04:00:00.000Z',
  id: 'demo-request-1',
  itemId: '공룡-001',
  message: '',
  platform: '1688',
  price: '4.12',
  product: '공룡',
  productName: '跨境儿童纸质恐龙3D立体拼图动物模型拼装亚马逊玩具益智DIY手工',
  requestType: '차단 신청',
  salesCount: 50,
  salesUrl: 'https://page.1688.com/shtml/static/wrongpage.html',
  searchDate: '2026-04-02',
  status: '신규요청',
  userEmail: 'lifang@admin.kr',
  userId: 'demo-user',
};

export const demoAdminRequests = [demoAdminRequest];

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

function mapAdminRequest(row: AdminRequestRow): AdminRequest {
  return {
    companyName: row.seller_name ?? '',
    createdAt: row.created_at ?? '',
    id: row.id,
    itemId: row.sheet_record_id ?? '',
    message: row.user_message ?? row.admin_note ?? '',
    platform: row.platform ?? '',
    price: '',
    product: row.product ?? '',
    productName: row.product_name ?? '',
    requestType: row.request_type ?? '차단 신청',
    salesCount: 0,
    salesUrl: row.sales_url ?? '',
    searchDate: '',
    status: normalizeRequestStatus(row.status),
    userEmail: row.user_message ?? '',
    userId: row.customer_id ?? '',
  };
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
      'id,customer_id,customer_user_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as AdminRequestRow[]).map(mapAdminRequest);
}

export async function getAdminRequestById(id: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('admin_requests')
    .select(
      'id,customer_id,customer_user_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapAdminRequest(data as AdminRequestRow) : null;
}

export async function createAdminRequest({ item, product, userEmail, userId }: CreateAdminRequestInput) {
  const supabase = createServerDatabaseClient();
  const customerId = await getOrCreateRequestCustomer(userEmail);
  const { data, error } = await supabase
    .from('admin_requests')
    .insert({
      admin_note: userId,
      customer_id: customerId,
      customer_user_id: null,
      sheet_record_id: null,
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
      'id,customer_id,customer_user_id,sheet_record_id,product,product_name,seller_name,platform,sales_url,request_type,user_message,admin_note,status,created_at'
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAdminRequest(data as AdminRequestRow);
}
