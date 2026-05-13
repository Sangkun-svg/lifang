import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAdminRequests } from '@/lib/admin/requests';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { AdminRequest } from '@/types/adminRequest';
import type { SheetSummary } from '@/types/sheet';

import styles from './index.module.css';

type AdminRequestsPageProps = {
  requests: AdminRequest[];
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

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
    hour: '2-digit',
    minute: '2-digit',
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
  return (
    <>
      <Head>
        <title>최근 요청 | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.page}>
          <header className={styles.header}>
            <h1 className={styles.title}>최근 요청</h1>
            <p className={styles.count}>총 {requests.length.toLocaleString('ko-KR')}건</p>
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
              {requests.length > 0 ? (
                requests.map((request) => (
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
