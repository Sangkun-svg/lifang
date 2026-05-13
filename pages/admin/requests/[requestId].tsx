import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';
import type { ApiResponse } from '@/lib/api/responses';
import { demoAdminRequest, getAdminRequestById } from '@/lib/admin/requests';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { AdminRequest, AdminRequestStatus } from '@/types/adminRequest';
import type { SheetSummary } from '@/types/sheet';

import styles from './detail.module.css';

type AdminRequestDetailPageProps = {
  request: AdminRequest;
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

type InfoRow = {
  label: string;
  value: string;
};

type EditableRequestFields = Pick<
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
  | 'status'
>;

type UpdateRequestResponse = {
  request: AdminRequest;
};

const requestStatusOptions: AdminRequestStatus[] = ['신규요청', '처리중', '처리완료', '반려'];
const blockStatusOptions = ['미신청', '신고완료', '차단완료'];

function InfoSection({ rows, title }: { rows: InfoRow[]; title: string }) {
  return (
    <section className={styles.section}>
      <h2>{title}</h2>
      <dl className={styles.infoList}>
        {rows.map((row) => (
          <div className={styles.infoRow} key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function createEditableFields(request: AdminRequest): EditableRequestFields {
  return {
    blockApproval: request.blockApproval,
    blockObjection: request.blockObjection,
    blockObjectionDecision: request.blockObjectionDecision,
    blockObjectionReason: request.blockObjectionReason,
    blockReapproval: request.blockReapproval,
    blockRejectionReason: request.blockRejectionReason,
    blockReport: request.blockReport,
    blockRereport: request.blockRereport,
    blockRereportRejectionReason: request.blockRereportRejectionReason,
    blockStatus: request.blockStatus || '미신청',
    status: request.status,
  };
}

function EditableRow({
  field,
  label,
  onChange,
  options,
  value,
}: {
  field: keyof EditableRequestFields;
  label: string;
  onChange: (field: keyof EditableRequestFields, value: string) => void;
  options?: string[];
  value: string;
}) {
  return (
    <div className={styles.editRow}>
      <label htmlFor={field}>{label}</label>
      {options ? (
        <select id={field} value={value} onChange={(event) => onChange(field, event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input id={field} value={value} onChange={(event) => onChange(field, event.target.value)} type="text" />
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<AdminRequestDetailPageProps> = async ({ query, req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  const requestId = Array.isArray(query.requestId) ? query.requestId[0] : query.requestId;

  if (!requestId) {
    return {
      redirect: {
        destination: '/admin/requests',
        permanent: false,
      },
    };
  }

  try {
    const request = requestId === demoAdminRequest.id ? demoAdminRequest : await getAdminRequestById(requestId);

    if (!request) {
      return {
        redirect: {
          destination: '/admin/requests',
          permanent: false,
        },
      };
    }

    let sheetSummaries: SheetSummary[] = [];

    try {
      sheetSummaries = await getSheetSummaries();
    } catch (error) {
      console.error('Load request detail sheet summaries failed', error);
    }

    return {
      props: {
        request,
        sheetSummaries,
        user,
      },
    };
  } catch (error) {
    console.error('Load admin request detail failed', error);

    return {
      redirect: {
        destination: '/admin/requests',
        permanent: false,
      },
    };
  }
};

export default function AdminRequestDetailPage({ request, sheetSummaries }: AdminRequestDetailPageProps) {
  const [currentRequest, setCurrentRequest] = useState(request);
  const [fields, setFields] = useState<EditableRequestFields>(() => createEditableFields(request));
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const requestRows: InfoRow[] = [
    { label: '요청자', value: currentRequest.userEmail || '-' },
    { label: '요청 구분', value: currentRequest.requestType || '-' },
    { label: '처리 상태', value: currentRequest.status },
    { label: '검색 날짜', value: currentRequest.searchDate || '-' },
    { label: '시트 레코드', value: currentRequest.sheetRecordId || '-' },
  ];
  const productRows: InfoRow[] = [
    { label: '상품', value: currentRequest.product || '-' },
    { label: '침해 제품명', value: currentRequest.productName || '-' },
    { label: '침해 업체명', value: currentRequest.companyName || '-' },
    { label: '침해 플랫폼', value: currentRequest.platform || '-' },
    { label: '판매가', value: currentRequest.price || '-' },
    { label: '판매수량', value: String(currentRequest.salesCount || '-') },
    { label: '판매링크', value: currentRequest.salesUrl || '-' },
  ];

  const handleFieldChange = (field: keyof EditableRequestFields, value: string) => {
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
      const response = await fetch(`/api/admin/requests/${encodeURIComponent(currentRequest.id)}`, {
        body: JSON.stringify(fields),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      const payload = (await response.json()) as ApiResponse<UpdateRequestResponse>;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? '저장 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      setCurrentRequest(payload.data.request);
      setFields(createEditableFields(payload.data.request));
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
        <title>최근 요청 상세 | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.page}>
          <form className={styles.card} id="request-detail-form" onSubmit={handleSubmit}>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>최근 요청</p>
                <h1 className={styles.title}>{currentRequest.productName}</h1>
              </div>
              <span className={styles.status} data-status={fields.status}>
                {fields.status}
              </span>
            </header>

            {currentRequest.imageUrl ? (
              <img className={styles.productImage} src={currentRequest.imageUrl} alt={`${currentRequest.productName} 제품`} />
            ) : null}

            <InfoSection rows={requestRows} title="요청 정보" />
            <div className={styles.divider} />
            <InfoSection rows={productRows} title="침해 상품 정보" />
            <div className={styles.divider} />

            <section className={styles.section}>
              <h2>처리 정보</h2>
              <div className={styles.editList}>
                <EditableRow
                  field="status"
                  label="처리 상태"
                  onChange={handleFieldChange}
                  options={requestStatusOptions}
                  value={fields.status}
                />
                <EditableRow
                  field="blockStatus"
                  label="차단 여부"
                  onChange={handleFieldChange}
                  options={blockStatusOptions}
                  value={fields.blockStatus}
                />
                <EditableRow field="blockReport" label="차단 신고" onChange={handleFieldChange} value={fields.blockReport} />
                <EditableRow
                  field="blockApproval"
                  label="차단 신고 승인"
                  onChange={handleFieldChange}
                  value={fields.blockApproval}
                />
                <EditableRow
                  field="blockRejectionReason"
                  label="차단 신고 미승인(이유)"
                  onChange={handleFieldChange}
                  value={fields.blockRejectionReason}
                />
                <EditableRow
                  field="blockObjection"
                  label="상대방 이의신청"
                  onChange={handleFieldChange}
                  value={fields.blockObjection}
                />
                <EditableRow
                  field="blockObjectionDecision"
                  label="이의신청 승인/기각"
                  onChange={handleFieldChange}
                  value={fields.blockObjectionDecision}
                />
                <EditableRow
                  field="blockObjectionReason"
                  label="이의신청 사유"
                  onChange={handleFieldChange}
                  value={fields.blockObjectionReason}
                />
                <EditableRow field="blockRereport" label="차단 신고(재)" onChange={handleFieldChange} value={fields.blockRereport} />
                <EditableRow
                  field="blockReapproval"
                  label="차단 신고(재) 승인"
                  onChange={handleFieldChange}
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

          </form>

          <div className={styles.actions}>
            <Link className={styles.backButton} href="/admin/requests">
              목록으로
            </Link>
            <button className={styles.saveButton} form="request-detail-form" type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <DoubleBounceLoader size={18} variant="light" label="요청 정보 저장 중" />
                  <span>저장 중</span>
                </>
              ) : (
                '저장하기'
              )}
            </button>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}
