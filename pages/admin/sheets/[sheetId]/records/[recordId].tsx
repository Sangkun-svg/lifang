import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';
import type { ApiResponse } from '@/lib/api/responses';
import { getSheetRecordById, getSheetSummaries, getSheetSummaryById } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { SheetRecord, SheetRecordStatus, SheetSummary } from '@/types/sheet';

import styles from '@/pages/admin/requests/detail.module.css';

type AdminSheetRecordDetailPageProps = {
  record: SheetRecord;
  sheet: SheetSummary;
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

type InfoRow = {
  label: string;
  value: string;
};

type EditableSheetRecordFields = Pick<
  SheetRecord,
  | 'blockApproval'
  | 'blockObjection'
  | 'blockObjectionDecision'
  | 'blockObjectionReason'
  | 'blockReapproval'
  | 'blockRejectionReason'
  | 'blockReport'
  | 'blockRereport'
  | 'blockRereportRejectionReason'
  | 'status'
>;

type UpdateSheetRecordResponse = {
  record: SheetRecord;
};

const blockStatusOptions: SheetRecordStatus[] = ['미신청', '신고완료', '차단완료'];
const customInputOption = '__custom__';
const sheetRecordFieldOptions = {
  blockApproval: ['승인', '미승인'],
  blockObjection: ['이의신청', '이의신청 중'],
  blockObjectionDecision: ['승인'],
  blockObjectionReason: ['기각'],
  blockReapproval: ['승인', '미승인'],
  blockReport: ['신청', '완료', '반려'],
  blockRereport: ['신청', '완료', '반려'],
} satisfies Partial<Record<keyof EditableSheetRecordFields, string[]>>;

function InfoSection({ rows, title }: { rows: InfoRow[]; title: string }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <dl className={styles.infoList}>
        {rows.map((row) => (
          <div className={styles.infoRow} key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value || '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function createEditableFields(record: SheetRecord): EditableSheetRecordFields {
  return {
    blockApproval: record.blockApproval,
    blockObjection: record.blockObjection,
    blockObjectionDecision: record.blockObjectionDecision,
    blockObjectionReason: record.blockObjectionReason,
    blockReapproval: record.blockReapproval,
    blockRejectionReason: record.blockRejectionReason,
    blockReport: record.blockReport,
    blockRereport: record.blockRereport,
    blockRereportRejectionReason: record.blockRereportRejectionReason,
    status: record.status,
  };
}

function EditableRow({
  allowCustom = false,
  field,
  label,
  onChange,
  options,
  value,
}: {
  allowCustom?: boolean;
  field: keyof EditableSheetRecordFields;
  label: string;
  onChange: (field: keyof EditableSheetRecordFields, value: string) => void;
  options?: string[];
  value: string;
}) {
  const isKnownOption = Boolean(options?.includes(value));
  const isCustomValue = Boolean(options && allowCustom && value && value !== '-' && !isKnownOption);
  const [isCustomMode, setIsCustomMode] = useState(isCustomValue);
  const selectValue = options ? (isCustomMode ? customInputOption : isKnownOption ? value : '') : '';

  useEffect(() => {
    if (!options || !allowCustom) {
      return;
    }

    if (isKnownOption) {
      setIsCustomMode(false);
      return;
    }

    if (isCustomValue) {
      setIsCustomMode(true);
    }
  }, [allowCustom, isCustomValue, isKnownOption, options]);

  const handleSelectChange = (nextValue: string) => {
    if (nextValue === customInputOption) {
      setIsCustomMode(true);
      onChange(field, isCustomValue ? value : '');
      return;
    }

    setIsCustomMode(false);
    onChange(field, nextValue);
  };

  return (
    <div className={styles.editRow}>
      <label htmlFor={field}>{label}</label>
      {options ? (
        <div className={styles.editControlGroup}>
          <select id={field} value={selectValue} onChange={(event) => handleSelectChange(event.target.value)}>
            <option value="">선택</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            {allowCustom ? <option value={customInputOption}>직접입력</option> : null}
          </select>
          {selectValue === customInputOption ? (
            <input
              className={styles.customInput}
              id={`${field}-custom`}
              value={value === '-' ? '' : value}
              onChange={(event) => onChange(field, event.target.value)}
              placeholder={`${label} 직접 입력`}
              type="text"
            />
          ) : null}
        </div>
      ) : (
        <input id={field} value={value} onChange={(event) => onChange(field, event.target.value)} type="text" />
      )}
    </div>
  );
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const getServerSideProps: GetServerSideProps<AdminSheetRecordDetailPageProps> = async ({ query, req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  const sheetId = getQueryValue(query.sheetId);
  const recordId = getQueryValue(query.recordId);

  if (!sheetId || !recordId) {
    return {
      redirect: {
        destination: '/admin/sheets',
        permanent: false,
      },
    };
  }

  try {
    const [sheet, record, sheetSummaries] = await Promise.all([
      getSheetSummaryById(sheetId),
      getSheetRecordById(sheetId, recordId),
      getSheetSummaries(),
    ]);

    if (!sheet || !record) {
      return {
        redirect: {
          destination: sheet ? `/admin/sheets/${sheet.id}` : '/admin/sheets',
          permanent: false,
        },
      };
    }

    return {
      props: {
        record,
        sheet,
        sheetSummaries,
        user,
      },
    };
  } catch (error) {
    console.error('Load sheet record detail failed', error);

    return {
      redirect: {
        destination: '/admin/sheets',
        permanent: false,
      },
    };
  }
};

export default function AdminSheetRecordDetailPage({ record, sheet, sheetSummaries }: AdminSheetRecordDetailPageProps) {
  const [currentRecord, setCurrentRecord] = useState(record);
  const [fields, setFields] = useState<EditableSheetRecordFields>(() => createEditableFields(record));
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const sheetRows: InfoRow[] = [
    { label: '시트명', value: sheet.name },
    { label: '시트 레코드', value: currentRecord.id },
    { label: '검색 날짜', value: currentRecord.searchDate },
    { label: '매칭 상태', value: sheet.isMatched ? '매칭 완료' : sheet.deletionStatusLabel },
  ];
  const productRows: InfoRow[] = [
    { label: '침해 플랫폼', value: currentRecord.platform || currentRecord.category },
    { label: '침해 제품명', value: currentRecord.productName },
    { label: '침해 업체명', value: currentRecord.companyName },
    { label: '판매가', value: currentRecord.price },
    { label: '판매수량', value: String(currentRecord.salesCount || '-') },
    { label: '판매링크', value: currentRecord.salesUrl },
  ];

  const handleFieldChange = (field: keyof EditableSheetRecordFields, value: string) => {
    setFields((previousFields) => ({
      ...previousFields,
      [field]: value,
    }));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/sheet-records/${encodeURIComponent(currentRecord.id)}`, {
        body: JSON.stringify({
          blockApproval: fields.blockApproval,
          blockObjection: fields.blockObjection,
          blockObjectionDecision: fields.blockObjectionDecision,
          blockObjectionReason: fields.blockObjectionReason,
          blockReapproval: fields.blockReapproval,
          blockRejectionReason: fields.blockRejectionReason,
          blockReport: fields.blockReport,
          blockRereport: fields.blockRereport,
          blockRereportRejectionReason: fields.blockRereportRejectionReason,
          blockStatus: fields.status,
          sheetId: sheet.id,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      const payload = (await response.json()) as ApiResponse<UpdateSheetRecordResponse>;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? '저장 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      setCurrentRecord(payload.data.record);
      setFields(createEditableFields(payload.data.record));
      setSuccessMessage('저장되었습니다.');
    } catch {
      setErrorMessage('저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>{currentRecord.productName || sheet.name} | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.page}>
          <form className={styles.card} onSubmit={handleSubmit}>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>업로드 시트 상세</p>
                <h1 className={styles.title}>{currentRecord.productName || sheet.name}</h1>
              </div>
              <span className={styles.status}>{fields.status}</span>
            </header>

            {currentRecord.imageUrl ? (
              <img className={styles.productImage} src={currentRecord.imageUrl} alt={`${currentRecord.productName} 제품`} />
            ) : null}

            <InfoSection rows={sheetRows} title="시트 정보" />
            <div className={styles.divider} />
            <InfoSection rows={productRows} title="침해 상품 정보" />
            <div className={styles.divider} />
            <section className={styles.section}>
              <h2>차단 정보</h2>
              <div className={styles.editList}>
                <EditableRow
                  field="status"
                  label="진행 상황"
                  onChange={handleFieldChange}
                  options={blockStatusOptions}
                  value={fields.status}
                />
                <EditableRow
                  allowCustom
                  field="blockReport"
                  label="차단 신고"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockReport}
                  value={fields.blockReport}
                />
                <EditableRow
                  allowCustom
                  field="blockApproval"
                  label="차단 신고 승인"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockApproval}
                  value={fields.blockApproval}
                />
                <EditableRow
                  field="blockRejectionReason"
                  label="차단 신고 미승인(이유)"
                  onChange={handleFieldChange}
                  value={fields.blockRejectionReason}
                />
                <EditableRow
                  allowCustom
                  field="blockObjection"
                  label="상대방 이의신청"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockObjection}
                  value={fields.blockObjection}
                />
                <EditableRow
                  allowCustom
                  field="blockObjectionDecision"
                  label="이의신청 승인"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockObjectionDecision}
                  value={fields.blockObjectionDecision}
                />
                <EditableRow
                  allowCustom
                  field="blockObjectionReason"
                  label="이의 신청"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockObjectionReason}
                  value={fields.blockObjectionReason}
                />
                <EditableRow
                  allowCustom
                  field="blockRereport"
                  label="차단신고 (재)신고"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockRereport}
                  value={fields.blockRereport}
                />
                <EditableRow
                  allowCustom
                  field="blockReapproval"
                  label="차단신고 (재)신고 승인"
                  onChange={handleFieldChange}
                  options={sheetRecordFieldOptions.blockReapproval}
                  value={fields.blockReapproval}
                />
                <EditableRow
                  field="blockRereportRejectionReason"
                  label="차단 신고(재) 미승인(이유)"
                  onChange={handleFieldChange}
                  value={fields.blockRereportRejectionReason}
                />
              </div>
            </section>

            {errorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? <p className={styles.successMessage}>{successMessage}</p> : null}

            <div className={styles.actions}>
              <span />
              <button className={styles.saveButton} type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <DoubleBounceLoader size={18} variant="light" label="시트 레코드 저장 중" />
                    <span>저장 중</span>
                  </>
                ) : (
                  '저장하기'
                )}
              </button>
            </div>
          </form>

          <Link className={styles.backButton} href={`/admin/sheets/${sheet.id}`}>
            목록으로
          </Link>
        </div>
      </AdminLayout>
    </>
  );
}
