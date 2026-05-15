import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAdminRequests } from '@/lib/admin/requests';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { AdminRequest, AdminRequestStatus } from '@/types/adminRequest';
import type { SheetSummary } from '@/types/sheet';

import styles from './index.module.css';

type AdminRequestsPageProps = {
  requests: AdminRequest[];
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

type RequestSortField = 'createdAtDesc' | 'createdAtAsc' | 'platform' | 'user' | 'name' | 'status';
type RequestStatusFilter = AdminRequestStatus | 'all';

const requestSortOptions: Array<{ label: string; value: RequestSortField }> = [
  { label: '날짜순 최신', value: 'createdAtDesc' },
  { label: '날짜순 오래된', value: 'createdAtAsc' },
  { label: '플랫폼순', value: 'platform' },
  { label: '유저순', value: 'user' },
  { label: '이름순', value: 'name' },
  { label: '상태순', value: 'status' },
];

const requestStatusFilterOptions: Array<{ label: string; value: RequestStatusFilter }> = [
  { label: '전체', value: 'all' },
  { label: '신규요청', value: '신규요청' },
  { label: '처리중', value: '처리중' },
  { label: '처리완료', value: '처리완료' },
  { label: '반려', value: '반려' },
];

function formatDateTime(value: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}

export const getServerSideProps: GetServerSideProps<AdminRequestsPageProps> = async ({ req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  try {
    const [requests, sheetSummaries] = await Promise.all([getAdminRequests(), getSheetSummaries()]);

    return {
      props: {
        requests,
        sheetSummaries,
        user,
      },
    };
  } catch (error) {
    console.error('Load admin requests failed', error);

    return {
      props: {
        requests: [],
        sheetSummaries: [],
        user,
      },
    };
  }
};

export default function AdminRequestsPage({ requests, sheetSummaries }: AdminRequestsPageProps) {
  const [sortField, setSortField] = useState<RequestSortField>('createdAtDesc');
  const [statusFilter, setStatusFilter] = useState<RequestStatusFilter>('all');
  const visibleRequests = useMemo(() => {
    const filteredRequests = requests.filter((request) => statusFilter === 'all' || request.status === statusFilter);

    return filteredRequests.sort((first, second) => {
      if (sortField === 'createdAtDesc') {
        return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
      }

      if (sortField === 'createdAtAsc') {
        return new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
      }

      if (sortField === 'platform') {
        return first.platform.localeCompare(second.platform, 'ko-KR');
      }

      if (sortField === 'user') {
        return first.userEmail.localeCompare(second.userEmail, 'ko-KR');
      }

      if (sortField === 'name') {
        return first.productName.localeCompare(second.productName, 'ko-KR');
      }

      return first.status.localeCompare(second.status, 'ko-KR');
    });
  }, [requests, sortField, statusFilter]);

  return (
    <>
      <Head>
        <title>최근 요청 | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.page}>
          <header className={styles.header}>
            <h1 className={styles.title}>최근 요청({requests.length.toLocaleString('ko-KR')}건)</h1>
            <div className={styles.headerControls}>
              <label className={styles.sortGroup}>
                <span>정렬</span>
                <select value={sortField} onChange={(event) => setSortField(event.target.value as RequestSortField)}>
                  {requestSortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.sortGroup}>
                <span>진행상황</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RequestStatusFilter)}>
                  {requestStatusFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>

          <section className={styles.tableCard} aria-label="최근 요청 테이블">
            <div className={styles.tableHeader}>
              <span className={styles.dateCell}>요청 일시</span>
              <span className={styles.userCell}>요청자</span>
              <span className={styles.productCell}>상품</span>
              <span className={styles.nameCell}>침해 제품명</span>
              <span className={styles.platformCell}>플랫폼</span>
              <span className={styles.statusCell}>상태</span>
              <span className={styles.detailCell}>상세정보</span>
            </div>

            <div className={styles.rows}>
              {visibleRequests.length > 0 ? (
                visibleRequests.map((request) => (
                  <div className={styles.tableRow} key={request.id}>
                    <span className={styles.dateCell}>{formatDateTime(request.createdAt)}</span>
                    <span className={styles.userCell}>{request.userEmail}</span>
                    <span className={styles.productCell}>{request.product}</span>
                    <span className={styles.nameCell}>{request.productName}</span>
                    <span className={styles.platformCell}>{request.platform}</span>
                    <span className={styles.statusCell} data-status={request.status}>
                      <i />
                      {request.status}
                    </span>
                    <Link className={styles.detailCell} href={`/admin/requests/${request.id}`}>
                      보기
                    </Link>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>아직 접수된 요청이 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </AdminLayout>
    </>
  );
}
