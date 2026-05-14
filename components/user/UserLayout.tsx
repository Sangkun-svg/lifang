import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import { Footer } from '@/components/Footer';
import { BagIcon, HomeIcon } from '@/components/icons/AdminIcons';
import type { UserProductSummary } from '@/lib/user/productHistory';

import styles from './UserLayout.module.css';

type UserLayoutProps = {
  accountEmail?: string;
  accountName?: string;
  children: ReactNode;
  products?: UserProductSummary[];
};

export function UserLayout({ accountEmail = '', accountName = '고객 계정', children, products = [] }: UserLayoutProps) {
  const router = useRouter();
  const queryProduct = typeof router.query.product === 'string' ? router.query.product : null;
  const activeProduct = queryProduct && products.some((product) => product.id === queryProduct) ? queryProduct : null;
  const isHistoryRoute = router.pathname.startsWith('/products');

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.account}>
            <p className={styles.company}>{accountName}</p>
            <p className={styles.siteUrl}>{accountEmail || '-'}</p>
          </div>

          <nav className={styles.nav} aria-label="사용자 메뉴">
            <Link className={styles.navItem} data-active={router.pathname === '/dashboard'} href="/dashboard">
              <HomeIcon className={styles.navIcon} />
              대시보드
            </Link>
            <div className={styles.navItem} data-active={isHistoryRoute}>
              <BagIcon className={styles.navIcon} />
              내역목록
            </div>
            <div className={styles.productList} aria-label="상품 목록">
              {products.length > 0 ? (
                products.map((product) => (
                  <Link
                    className={styles.productItem}
                    data-active={isHistoryRoute && activeProduct === product.id}
                    href={`/products/${encodeURIComponent(product.id)}`}
                    key={product.id}
                  >
                    <span className={styles.productLabel}>
                      <span className={styles.productDot} aria-hidden="true" />
                      <span>{product.name}</span>
                    </span>
                  </Link>
                ))
              ) : (
                <p className={styles.productEmpty}>업로드된 시트가 없습니다.</p>
              )}
            </div>
          </nav>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>

      <Footer />
    </div>
  );
}
