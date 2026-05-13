import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import { Footer } from '@/components/Footer';
import { BagIcon, HomeIcon } from '@/components/icons/AdminIcons';
import { isUserProduct, userProducts } from '@/lib/user/products';

import styles from './UserLayout.module.css';

type UserLayoutProps = {
  children: ReactNode;
};

export function UserLayout({ children }: UserLayoutProps) {
  const router = useRouter();
  const queryProduct = typeof router.query.product === 'string' ? router.query.product : null;
  const activeProduct = isUserProduct(queryProduct ?? undefined) ? queryProduct : null;
  const isHistoryRoute = router.pathname.startsWith('/products');

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.account}>
            <p className={styles.company}>주식회사 제로피</p>
            <p className={styles.siteUrl}>http://zerofee.kr/zerofee</p>
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
              {userProducts.map((product) => (
                <Link
                  className={styles.productItem}
                  data-active={isHistoryRoute && activeProduct === product}
                  href={`/products/${encodeURIComponent(product)}`}
                  key={product}
                >
                  <span className={styles.productLabel}>
                    <span className={styles.productDot} aria-hidden="true" />
                    <span>{product}</span>
                  </span>
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>

      <Footer />
    </div>
  );
}
