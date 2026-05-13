import { createServerDatabaseClient } from '@/lib/supabase/database';
import type { ProductHistoryItem } from '@/lib/user/productHistory';
import type { AdminRequest, AdminRequestStatus } from '@/types/adminRequest';

type AdminRequestRow = {
  company_name: string | null;
  created_at: string | null;
  id: string;
  item_id: string | null;
  message: string | null;
  platform: string | null;
  price: string | null;
  product: string | null;
  product_name: string | null;
  request_type: string | null;
  sales_count: number | null;
  sales_url: string | null;
  search_date: string | null;
  status: string | null;
  user_email: string | null;
  user_id: string | null;
};

type CreateAdminRequestInput = {
  item: ProductHistoryItem;
  product: string;
  userEmail: string;
  userId: string;
};

function normalizeRequestStatus(value: string | null): AdminRequestStatus {
  if (value === '처리중' || value === '처리완료') {
    return value;
  }

  return '신규요청';
}

function mapAdminRequest(row: AdminRequestRow): AdminRequest {
  return {
    companyName: row.company_name ?? '',
    createdAt: row.created_at ?? '',
    id: row.id,
    itemId: row.item_id ?? '',
    message: row.message ?? '',
    platform: row.platform ?? '',
    price: row.price ?? '',
    product: row.product ?? '',
    productName: row.product_name ?? '',
    requestType: row.request_type ?? '차단 신청',
    salesCount: row.sales_count ?? 0,
    salesUrl: row.sales_url ?? '',
    searchDate: row.search_date ?? '',
    status: normalizeRequestStatus(row.status),
    userEmail: row.user_email ?? '',
    userId: row.user_id ?? '',
  };
}

export async function getAdminRequests() {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('admin_requests')
    .select(
      'id,user_id,user_email,product,item_id,product_name,company_name,platform,price,sales_count,sales_url,search_date,request_type,message,status,created_at'
    )
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
      'id,user_id,user_email,product,item_id,product_name,company_name,platform,price,sales_count,sales_url,search_date,request_type,message,status,created_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapAdminRequest(data as AdminRequestRow) : null;
}

export async function createAdminRequest({ item, product, userEmail, userId }: CreateAdminRequestInput) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('admin_requests')
    .upsert(
      {
        company_name: item.companyName,
        item_id: item.id,
        message: '',
        platform: item.platform,
        price: item.price,
        product,
        product_name: item.productName,
        request_type: '차단 신청',
        sales_count: item.salesCount,
        sales_url: item.salesUrl,
        search_date: item.searchDate,
        status: '신규요청',
        user_email: userEmail,
        user_id: userId,
      },
      {
        onConflict: 'user_id,item_id,request_type',
      }
    )
    .select(
      'id,user_id,user_email,product,item_id,product_name,company_name,platform,price,sales_count,sales_url,search_date,request_type,message,status,created_at'
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapAdminRequest(data as AdminRequestRow);
}
