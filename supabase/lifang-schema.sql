create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text not null,
  product text not null,
  item_id text not null,
  product_name text not null,
  company_name text not null,
  platform text not null,
  price text not null,
  sales_count integer not null default 0,
  sales_url text not null,
  search_date date not null,
  request_type text not null default '차단 신청',
  message text not null default '',
  status text not null default '신규요청',
  created_at timestamptz not null default now(),
  unique (user_id, item_id, request_type)
);

create table if not exists public.sheet_uploads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  original_file_name text not null,
  record_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sheet_records (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.sheet_uploads(id) on delete cascade,
  row_index integer not null,
  image_url text not null default '',
  product_name text not null,
  sales_url text not null default '',
  category text not null default '',
  platform text not null default '',
  company_name text not null default '',
  price text not null default '',
  sales_count integer not null default 0,
  status text not null default '미신청',
  search_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists admin_requests_created_at_idx on public.admin_requests (created_at desc);
create index if not exists sheet_uploads_created_at_idx on public.sheet_uploads (created_at desc);
create index if not exists sheet_records_sheet_id_idx on public.sheet_records (sheet_id, row_index);
