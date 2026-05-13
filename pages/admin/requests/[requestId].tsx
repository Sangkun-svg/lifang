import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { getAdminRequestById } from '@/lib/admin/requests';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { AdminRequest } from '@/types/adminRequest';
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
    const [request, sheetSummaries] = await Promise.all([getAdminRequestById(requestId), getSheetSummaries()]);

    if (!request) {
      return {
        redirect: {
          destination: '/admin/requests',
          permanent: false,
        },
      };
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
  const requestRows: InfoRow[] = [
    { label: '요청자', value: request.userEmail },
    { label: '요청 구분', value: request.requestType },
    { label: '처리 상태', value: request.status },
    { label: '검색 날짜', value: request.searchDate },
  ];
  const productRows: InfoRow[] = [
    { label: '상품', value: request.product },
    { label: '침해 제품명', value: request.productName },
    { label: '침해 업체명', value: request.companyName },
    { label: '침해 플랫폼', value: request.platform },
    { label: '판매가', value: request.price },
    { label: '판매수량', value: String(request.salesCount) },
    { label: '판매링크', value: request.salesUrl },
  ];

  return (
    <>
      <Head>
        <title>최근 요청 상세 | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.page}>
          <article className={styles.card}>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>최근 요청</p>
                <h1 className={styles.title}>{request.productName}</h1>
              </div>
              <span className={styles.status} data-status={request.status}>
                {request.status}
              </span>
            </header>

            <InfoSection rows={requestRows} title="요청 정보" />
            <div className={styles.divider} />
            <InfoSection rows={productRows} title="침해 상품 정보" />
          </article>

          <Link className={styles.backButton} href="/admin/requests">
            목록으로
          </Link>
        </div>
      </AdminLayout>
    </>
  );
}
