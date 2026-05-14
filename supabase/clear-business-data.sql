-- LIFANG business-data reset query.
--
-- Run this in the Supabase SQL Editor when you want to remove uploaded sheets,
-- parsed rows, customer/member data, and admin/user requests before QA with real
-- data only.
--
-- This intentionally preserves auth.users and public.admin_profiles so the
-- existing admin login can keep working.

begin;

truncate table
  public.admin_requests,
  public.sheet_records,
  public.sheets,
  public.customer_users,
  public.customers
restart identity cascade;

commit;
