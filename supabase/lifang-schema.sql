-- LIFANG INC. Supabase baseline schema.
--
-- Deletion policy:
-- - customers, customer_users, admin_requests: soft delete via deleted_at.
-- - sheets and sheet_records: hard delete. Deleting a sheet cascades its records.
-- - When a customer is removed in the app, soft-delete the customer/user/request rows
--   and hard-delete that customer's sheets to remove large uploaded data.
--
-- This file is intended as the fresh baseline schema. If old demo tables already
-- exist in Supabase, review a migration/reset before applying it to real data.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

do $$
begin
  create type public.account_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.sheet_upload_status as enum ('uploaded', 'processing', 'failed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.admin_request_status as enum ('new', 'in_progress', 'done', 'rejected');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  email citext not null,
  role public.account_role not null default 'admin',
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint admin_profiles_role_admin_chk check (role = 'admin')
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  manager_name text not null default '',
  primary_email citext not null,
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.customer_users (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  email citext not null,
  password_hash text not null,
  role public.account_role not null default 'user',
  display_name text not null default '',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint customer_users_role_user_chk check (role = 'user')
);

create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete restrict,
  name text not null,
  original_file_name text not null,
  record_count integer not null default 0,
  upload_status public.sheet_upload_status not null default 'uploaded',
  uploaded_by_admin_id uuid references public.admin_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sheet_records (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid not null references public.sheets(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete restrict,
  row_index integer not null,
  source_sequence integer,
  search_date date,
  infringing_product_image_url text not null default '',
  platform text not null default '',
  product_name text not null default '',
  seller_name text not null default '',
  original_product_image_url text not null default '',
  infringing_product_image_link text not null default '',
  price_yen numeric(14, 2),
  price_raw text not null default '',
  sales_count integer,
  infringing_product_url text not null default '',
  block_status_text text not null default '',
  block_report_text text not null default '',
  block_report_approval_text text not null default '',
  block_report_rejection_reason text not null default '',
  opposition_text text not null default '',
  opposition_approval_text text not null default '',
  opposition_approval_reason text not null default '',
  opposition_rejection_reason text not null default '',
  block_rereport_text text not null default '',
  block_rereport_approval_text text not null default '',
  block_rereport_rejection_reason text not null default '',
  raw_record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete restrict,
  customer_user_id uuid references public.customer_users(id) on delete set null,
  sheet_id uuid references public.sheets(id) on delete set null,
  sheet_record_id uuid references public.sheet_records(id) on delete set null,
  product text not null default '',
  product_name text not null default '',
  seller_name text not null default '',
  platform text not null default '',
  sales_url text not null default '',
  request_type text not null default 'block_request',
  status public.admin_request_status not null default 'new',
  user_message text not null default '',
  admin_note text not null default '',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

drop trigger if exists set_admin_profiles_updated_at on public.admin_profiles;
create trigger set_admin_profiles_updated_at
before update on public.admin_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_customer_users_updated_at on public.customer_users;
create trigger set_customer_users_updated_at
before update on public.customer_users
for each row execute function public.set_updated_at();

drop trigger if exists set_sheets_updated_at on public.sheets;
create trigger set_sheets_updated_at
before update on public.sheets
for each row execute function public.set_updated_at();

drop trigger if exists set_sheet_records_updated_at on public.sheet_records;
create trigger set_sheet_records_updated_at
before update on public.sheet_records
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_requests_updated_at on public.admin_requests;
create trigger set_admin_requests_updated_at
before update on public.admin_requests
for each row execute function public.set_updated_at();

create unique index if not exists admin_profiles_active_email_uidx
  on public.admin_profiles (email)
  where deleted_at is null;

create unique index if not exists customers_active_email_uidx
  on public.customers (primary_email)
  where deleted_at is null;

create index if not exists customers_active_created_at_idx
  on public.customers (created_at desc)
  where deleted_at is null;

create unique index if not exists customer_users_active_email_uidx
  on public.customer_users (email)
  where deleted_at is null;

create index if not exists customer_users_customer_id_idx
  on public.customer_users (customer_id)
  where deleted_at is null;

create index if not exists sheets_customer_id_created_at_idx
  on public.sheets (customer_id, created_at desc);

create index if not exists sheets_name_trgm_idx
  on public.sheets using gin (name gin_trgm_ops);

create unique index if not exists sheet_records_sheet_row_uidx
  on public.sheet_records (sheet_id, row_index);

create index if not exists sheet_records_sheet_id_idx
  on public.sheet_records (sheet_id, row_index);

create index if not exists sheet_records_customer_date_idx
  on public.sheet_records (customer_id, search_date desc);

create index if not exists sheet_records_customer_platform_idx
  on public.sheet_records (customer_id, platform);

create index if not exists sheet_records_customer_block_status_idx
  on public.sheet_records (customer_id, block_status_text);

create index if not exists sheet_records_product_name_trgm_idx
  on public.sheet_records using gin (product_name gin_trgm_ops);

create index if not exists sheet_records_seller_name_trgm_idx
  on public.sheet_records using gin (seller_name gin_trgm_ops);

create index if not exists sheet_records_raw_record_gin_idx
  on public.sheet_records using gin (raw_record);

create index if not exists admin_requests_active_customer_created_at_idx
  on public.admin_requests (customer_id, created_at desc)
  where deleted_at is null;

create index if not exists admin_requests_active_status_idx
  on public.admin_requests (status, created_at desc)
  where deleted_at is null;

create unique index if not exists admin_requests_active_user_record_type_uidx
  on public.admin_requests (customer_user_id, sheet_record_id, request_type)
  where deleted_at is null and sheet_record_id is not null;

alter table public.admin_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.customer_users enable row level security;
alter table public.sheets enable row level security;
alter table public.sheet_records enable row level security;
alter table public.admin_requests enable row level security;

comment on table public.admin_profiles is 'Supabase Auth-backed administrator profiles. Admins share the same management data view.';
comment on table public.customers is 'Soft-deleted customer/company accounts.';
comment on table public.customer_users is 'App-managed customer login accounts. Passwords must be stored as hashes.';
comment on table public.sheets is 'Customer sheet uploads. Sheets are hard-deleted with their sheet_records.';
comment on table public.sheet_records is 'Parsed Excel rows mapped from the customer upload, with raw_record preserving the original row.';
comment on table public.admin_requests is 'User block requests shown in the admin Recent Requests screen. Soft-deleted via deleted_at.';
