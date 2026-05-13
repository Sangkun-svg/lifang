import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

import { Footer } from '@/components/Footer';
import { MemberListIcon, RequestIcon, SheetIcon } from '@/components/icons/AdminIcons';
import type { SheetSummary } from '@/types/sheet';

import styles from './AdminLayout.module.css';

type AdminLayoutProps = {
  children: ReactNode;
  sheetSummaries?: SheetSummary[];
};

export function AdminLayout({ children, sheetSummaries = [] }: AdminLayoutProps) {
  const router = useRouter();
  const isSheetRoute = router.pathname.startsWith('/admin/sheets');

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.account}>
            <p className={styles.company}>리팡 외국자문법률사무소</p>
            <p className={styles.email}>khpark@lifang.kr</p>
          </div>

          <nav className={styles.nav} aria-label="관리자 메뉴">
            <Link
              className={styles.navItem}
              data-active={router.pathname.startsWith('/admin/members')}
              href="/admin/members"
            >
              <MemberListIcon className={styles.navIcon} />
              회원목록
            </Link>
            <Link
              className={styles.navItem}
              data-active={router.pathname.startsWith('/admin/requests')}
              href="/admin/requests"
            >
              <RequestIcon className={styles.navIcon} />
              최근 요청
            </Link>
            <Link className={styles.navItem} data-active={isSheetRoute} href="/admin/sheets">
              <SheetIcon className={styles.navIcon} />
              업로드 시트
            </Link>
            {sheetSummaries.length > 0 ? (
              <div className={styles.sheetList} aria-label="업로드 시트 목록">
                {sheetSummaries.map((sheet) => (
                  <Link
                    className={styles.sheetItem}
                    data-active={router.asPath.includes(`/admin/sheets/${sheet.id}`)}
                    href={`/admin/sheets/${sheet.id}`}
                    key={sheet.id}
                  >
                    <span className={styles.sheetLabel}>
                      <span className={styles.sheetDot} aria-hidden="true" />
                      <span>{sheet.name}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>

      <Footer />
    </div>
  );
}
