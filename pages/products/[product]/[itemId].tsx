import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { Footer } from '@/components/Footer';
import { getUserSessionUser } from '@/lib/auth/user';
import { getProductFromParam, getProductHistoryItem, type ProductHistoryItem } from '@/lib/user/productHistory';
import type { UserProduct } from '@/lib/user/products';

import styles from '../ProductHistory.module.css';

type ProductHistoryDetailPageProps = {
  item: ProductHistoryItem;
  product: UserProduct;
};

type InfoRow = {
  label: string;
  value: string;
};

function StatusValue({ status }: { status: string }) {
  return (
    <span className={styles.detailStatus} data-status={status}>
      <i />
      {status}
    </span>
  );
}

function InfoSection({ rows, title }: { rows: InfoRow[]; title: string }) {
  return (
    <section className={styles.detailSection}>
      <h2>{title}</h2>
      <dl className={styles.detailInfoList}>
        {rows.map((row) => (
          <div className={styles.detailInfoRow} key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export const getServerSideProps: GetServerSideProps<ProductHistoryDetailPageProps> = async ({ query, req, res }) => {
  const user = await getUserSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const product = getProductFromParam(query.product);
  const item = getProductHistoryItem(product, query.itemId);

  if (!item) {
    return {
      redirect: {
        destination: `/products/${encodeURIComponent(product)}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      item,
      product,
    },
  };
};

export default function ProductHistoryDetailPage({ item, product }: ProductHistoryDetailPageProps) {
  const productInfoRows: InfoRow[] = [
    { label: '침해 플랫폼', value: item.platform },
    { label: '침해 제품명', value: item.productName },
    { label: '침해 업체명', value: item.companyName },
    { label: '판매가', value: `${item.price}￥` },
    { label: '판매수량', value: String(item.salesCount) },
    { label: '판매링크', value: item.salesUrl },
  ];
  const blockInfoRows: InfoRow[] = [
    { label: '검색 날짜', value: item.searchDate.replaceAll('-', '. ') },
    { label: '차단 신고', value: item.blockReport },
    { label: '차단 신고 승인', value: item.blockApproval },
    { label: '차단 신고 미승인(이유)', value: item.blockRejectionReason },
    { label: '상대방 이의신청', value: item.blockObjection },
    { label: '이의신청 승인/기각', value: item.blockObjectionDecision },
    { label: '이의신청 승인(이유)', value: item.blockObjectionReason },
    { label: '차단 신고(재)', value: item.blockRereport },
    { label: '차단 신고(재) 승인', value: item.blockReapproval },
    { label: '차단 신고(재) 미승인(이유)', value: item.blockRereportRejectionReason },
  ];

  return (
    <>
      <Head>
        <title>{product} 내역상세 | LIFANG INC.</title>
      </Head>

      <div className={styles.detailShell}>
        <main className={styles.detailPage}>
          <div className={styles.detailWrap}>
            <article className={styles.detailCard}>
              <img className={styles.detailImage} src={item.imageUrl} alt={`${product} 침해 제품`} />
              <div className={styles.detailDivider} />

              <InfoSection rows={productInfoRows} title="침해 상품 정보" />
              <div className={styles.detailDivider} />

              <section className={styles.detailSection}>
                <h2>차단 정보</h2>
                <dl className={styles.detailInfoList}>
                  <div className={styles.detailInfoRow}>
                    <dt>진행 상황</dt>
                    <dd>
                      <StatusValue status={item.status} />
                    </dd>
                  </div>
                  {blockInfoRows.map((row) => (
                    <div className={styles.detailInfoRow} key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </article>

            <Link className={styles.backButton} href={`/products/${encodeURIComponent(product)}`}>
              목록으로
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
