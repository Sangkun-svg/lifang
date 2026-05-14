import { createServerDatabaseClient } from '@/lib/supabase/database';
import type { Member } from '@/types/member';

type CustomerRow = {
  created_at: string | null;
  company_name: string | null;
  id: string;
  manager_name: string | null;
  primary_email: string | null;
};

type CustomerSheetRow = {
  customer_id: string | null;
  id: string;
  name: string | null;
};

type CustomerUserAuthRow = {
  id: string;
  password_hash: string | null;
};

type SheetIdRow = {
  id: string;
};

type AssignableSheetRow = {
  customer_id: string | null;
  id: string;
};

export type CreateAdminMemberInput = {
  companyName: string;
  email: string;
  managerName: string;
  password: string;
  sheetIds: string[];
};

export type UpdateAdminMemberInput = {
  companyName: string;
  managerName: string;
  sheetIds: string[];
};

function formatDisplayDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

function formatDateValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function mapMember(row: CustomerRow, sheets: CustomerSheetRow[]): Member {
  const customerSheets = sheets.filter((sheet) => sheet.customer_id === row.id);
  const createdAt = row.created_at ?? '';

  return {
    companyName: row.company_name ?? '',
    createdAt: formatDisplayDate(createdAt),
    createdAtDate: formatDateValue(createdAt),
    email: row.primary_email ?? '',
    id: row.id,
    managerName: row.manager_name ?? '',
    sheetIds: customerSheets.map((sheet) => sheet.id),
    sheetLinks: customerSheets.map((sheet) => `/admin/sheets/${sheet.id}`),
    sheetNames: customerSheets.map((sheet) => sheet.name ?? '업로드 시트'),
  };
}

async function getSheetsForCustomers(customerIds: string[]) {
  if (customerIds.length === 0) {
    return [];
  }

  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('sheets')
    .select('id,customer_id,name')
    .in('customer_id', customerIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CustomerSheetRow[];
}

async function validateAssignableSheetIds(sheetIds: string[], memberId?: string) {
  if (sheetIds.length === 0) {
    return;
  }

  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase.from('sheets').select('id,customer_id').in('id', sheetIds);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== sheetIds.length) {
    throw new Error('SHEET_NOT_FOUND');
  }

  const hasAlreadyAssignedSheet = ((data ?? []) as AssignableSheetRow[]).some(
    (sheet) => sheet.customer_id !== null && sheet.customer_id !== memberId
  );

  if (hasAlreadyAssignedSheet) {
    throw new Error('SHEET_ALREADY_ASSIGNED');
  }
}

function getSupabaseAuthUserId(passwordHash: string | null) {
  const prefix = 'supabase-auth:';

  if (!passwordHash?.startsWith(prefix)) {
    return null;
  }

  return passwordHash.slice(prefix.length);
}

export async function getAdminMembers() {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id,company_name,manager_name,primary_email,created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const customers = (data ?? []) as CustomerRow[];
  const sheets = await getSheetsForCustomers(customers.map((customer) => customer.id));

  return customers.map((customer) => mapMember(customer, sheets));
}

export async function getAdminMemberById(memberId: string) {
  const supabase = createServerDatabaseClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id,company_name,manager_name,primary_email,created_at')
    .eq('id', memberId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const sheets = await getSheetsForCustomers([memberId]);

  return mapMember(data as CustomerRow, sheets);
}

export async function createAdminMember(input: CreateAdminMemberInput) {
  const supabase = createServerDatabaseClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: existingCustomer, error: existingCustomerError } = await supabase
    .from('customers')
    .select('id')
    .eq('primary_email', normalizedEmail)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingCustomerError) {
    throw new Error(existingCustomerError.message);
  }

  if (existingCustomer) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const { data: existingCustomerUser, error: existingCustomerUserError } = await supabase
    .from('customer_users')
    .select('id')
    .eq('email', normalizedEmail)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingCustomerUserError) {
    throw new Error(existingCustomerUserError.message);
  }

  if (existingCustomerUser) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  await validateAssignableSheetIds(input.sheetIds);

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password: input.password,
    user_metadata: {
      role: 'user',
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? 'AUTH_USER_CREATE_FAILED');
  }

  const authUserId = authData.user.id;

  try {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        company_name: input.companyName.trim(),
        manager_name: input.managerName.trim(),
        primary_email: normalizedEmail,
      })
      .select('id')
      .single();

    if (customerError || !customer) {
      throw new Error(customerError?.message ?? 'CUSTOMER_CREATE_FAILED');
    }

    const customerId = (customer as { id: string }).id;
    const { error: customerUserError } = await supabase.from('customer_users').insert({
      customer_id: customerId,
      display_name: input.managerName.trim(),
      email: normalizedEmail,
      password_hash: `supabase-auth:${authUserId}`,
      role: 'user',
    });

    if (customerUserError) {
      throw new Error(customerUserError.message);
    }

    if (input.sheetIds.length > 0) {
      const { error: sheetUpdateError } = await supabase.from('sheets').update({ customer_id: customerId }).in('id', input.sheetIds);

      if (sheetUpdateError) {
        throw new Error(sheetUpdateError.message);
      }

      const { error: sheetRecordUpdateError } = await supabase
        .from('sheet_records')
        .update({ customer_id: customerId })
        .in('sheet_id', input.sheetIds);

      if (sheetRecordUpdateError) {
        throw new Error(sheetRecordUpdateError.message);
      }
    }

    const member = await getAdminMemberById(customerId);

    if (!member) {
      throw new Error('MEMBER_NOT_FOUND_AFTER_CREATE');
    }

    return member;
  } catch (error) {
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(authUserId);

    if (deleteAuthError) {
      console.error('Rollback created auth user failed', deleteAuthError);
    }

    throw error;
  }
}

export async function updateAdminMember(memberId: string, input: UpdateAdminMemberInput) {
  const supabase = createServerDatabaseClient();
  const companyName = input.companyName.trim();
  const managerName = input.managerName.trim();

  const { data: customer, error: customerLookupError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', memberId)
    .is('deleted_at', null)
    .maybeSingle();

  if (customerLookupError) {
    throw new Error(customerLookupError.message);
  }

  if (!customer) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  await validateAssignableSheetIds(input.sheetIds, memberId);

  const { data: currentSheets, error: currentSheetsError } = await supabase.from('sheets').select('id').eq('customer_id', memberId);

  if (currentSheetsError) {
    throw new Error(currentSheetsError.message);
  }

  const nextSheetIds = new Set(input.sheetIds);
  const removedSheetIds = ((currentSheets ?? []) as Array<{ id: string }>)
    .map((sheet) => sheet.id)
    .filter((sheetId) => !nextSheetIds.has(sheetId));

  const { error: customerUpdateError } = await supabase
    .from('customers')
    .update({
      company_name: companyName,
      manager_name: managerName,
    })
    .eq('id', memberId);

  if (customerUpdateError) {
    throw new Error(customerUpdateError.message);
  }

  const { error: customerUserUpdateError } = await supabase
    .from('customer_users')
    .update({ display_name: managerName })
    .eq('customer_id', memberId)
    .is('deleted_at', null);

  if (customerUserUpdateError) {
    throw new Error(customerUserUpdateError.message);
  }

  if (removedSheetIds.length > 0) {
    const { error: removedSheetError } = await supabase.from('sheets').update({ customer_id: null }).in('id', removedSheetIds);

    if (removedSheetError) {
      throw new Error(removedSheetError.message);
    }

    const { error: removedRecordError } = await supabase.from('sheet_records').update({ customer_id: null }).in('sheet_id', removedSheetIds);

    if (removedRecordError) {
      throw new Error(removedRecordError.message);
    }
  }

  if (input.sheetIds.length > 0) {
    const { error: sheetUpdateError } = await supabase.from('sheets').update({ customer_id: memberId }).in('id', input.sheetIds);

    if (sheetUpdateError) {
      throw new Error(sheetUpdateError.message);
    }

    const { error: sheetRecordUpdateError } = await supabase
      .from('sheet_records')
      .update({ customer_id: memberId })
      .in('sheet_id', input.sheetIds);

    if (sheetRecordUpdateError) {
      throw new Error(sheetRecordUpdateError.message);
    }
  }

  const member = await getAdminMemberById(memberId);

  if (!member) {
    throw new Error('MEMBER_NOT_FOUND_AFTER_UPDATE');
  }

  return member;
}

export async function deleteAdminMember(memberId: string) {
  const supabase = createServerDatabaseClient();

  const { data: customer, error: customerLookupError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', memberId)
    .is('deleted_at', null)
    .maybeSingle();

  if (customerLookupError) {
    throw new Error(customerLookupError.message);
  }

  if (!customer) {
    throw new Error('MEMBER_NOT_FOUND');
  }

  const { data: customerUsers, error: customerUsersError } = await supabase
    .from('customer_users')
    .select('id,password_hash')
    .eq('customer_id', memberId)
    .is('deleted_at', null);

  if (customerUsersError) {
    throw new Error(customerUsersError.message);
  }

  const { data: sheets, error: sheetsError } = await supabase.from('sheets').select('id').eq('customer_id', memberId);

  if (sheetsError) {
    throw new Error(sheetsError.message);
  }

  const sheetIds = ((sheets ?? []) as SheetIdRow[]).map((sheet) => sheet.id);
  const authUserIds = ((customerUsers ?? []) as CustomerUserAuthRow[])
    .map((customerUser) => getSupabaseAuthUserId(customerUser.password_hash))
    .filter((authUserId): authUserId is string => authUserId !== null && authUserId.length > 0);

  const { error: requestDeleteError } = await supabase.from('admin_requests').delete().eq('customer_id', memberId);

  if (requestDeleteError) {
    throw new Error(requestDeleteError.message);
  }

  if (sheetIds.length > 0) {
    const { error: sheetDeleteError } = await supabase.from('sheets').delete().in('id', sheetIds);

    if (sheetDeleteError) {
      throw new Error(sheetDeleteError.message);
    }
  }

  const { error: customerUserDeleteError } = await supabase
    .from('customer_users')
    .delete()
    .eq('customer_id', memberId);

  if (customerUserDeleteError) {
    throw new Error(customerUserDeleteError.message);
  }

  const { error: customerDeleteError } = await supabase.from('customers').delete().eq('id', memberId);

  if (customerDeleteError) {
    throw new Error(customerDeleteError.message);
  }

  await Promise.all(
    authUserIds.map(async (authUserId) => {
      const { error } = await supabase.auth.admin.deleteUser(authUserId);

      if (error) {
        console.error('Delete member auth user failed', { authUserId, error });
      }
    })
  );

  return {
    id: memberId,
  };
}
