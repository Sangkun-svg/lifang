create or replace function public.create_sheet_upload_transaction(
  p_name text,
  p_original_file_name text,
  p_records jsonb
)
returns table (
  id uuid,
  customer_id uuid,
  name text,
  original_file_name text,
  record_count integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sheet_id uuid;
  v_record_count integer;
begin
  if nullif(btrim(p_name), '') is null then
    raise exception 'SHEET_NAME_REQUIRED';
  end if;

  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception 'SHEET_RECORDS_REQUIRED';
  end if;

  v_record_count := jsonb_array_length(p_records);

  if v_record_count <= 0 then
    raise exception 'EMPTY_SHEET';
  end if;

  lock table public.sheets in share row exclusive mode;

  if exists (select 1 from public.sheets s where s.name = btrim(p_name)) then
    raise exception 'SHEET_NAME_ALREADY_EXISTS';
  end if;

  insert into public.sheets (
    name,
    original_file_name,
    record_count,
    upload_status
  )
  values (
    btrim(p_name),
    coalesce(nullif(btrim(p_original_file_name), ''), 'upload.xlsx'),
    v_record_count,
    'uploaded'
  )
  returning public.sheets.id into v_sheet_id;

  insert into public.sheet_records (
    sheet_id,
    row_index,
    search_date,
    infringing_product_image_url,
    platform,
    product_name,
    seller_name,
    price_raw,
    sales_count,
    infringing_product_url,
    block_status_text,
    raw_record
  )
  select
    v_sheet_id,
    coalesce(nullif(record_item.record ->> 'rowIndex', '')::integer, record_item.ordinality::integer),
    nullif(record_item.record ->> 'searchDate', '')::date,
    coalesce(record_item.record ->> 'imageUrl', ''),
    coalesce(record_item.record ->> 'platform', ''),
    coalesce(record_item.record ->> 'productName', ''),
    coalesce(record_item.record ->> 'companyName', ''),
    coalesce(record_item.record ->> 'price', ''),
    nullif(record_item.record ->> 'salesCount', '')::integer,
    coalesce(record_item.record ->> 'salesUrl', ''),
    coalesce(record_item.record ->> 'status', ''),
    record_item.record - 'rowIndex'
  from jsonb_array_elements(p_records) with ordinality as record_item(record, ordinality);

  return query
  select
    s.id,
    s.customer_id,
    s.name,
    s.original_file_name,
    s.record_count,
    s.created_at
  from public.sheets s
  where s.id = v_sheet_id;
end;
$$;
