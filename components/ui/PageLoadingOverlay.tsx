import { useEffect, useState } from 'react';
import Router from 'next/router';

import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';

import styles from './PageLoadingOverlay.module.css';

export function PageLoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const showLoader = () => setIsLoading(true);
    const hideLoader = () => setIsLoading(false);

    Router.events.on('routeChangeStart', showLoader);
    Router.events.on('routeChangeComplete', hideLoader);
    Router.events.on('routeChangeError', hideLoader);

    return () => {
      Router.events.off('routeChangeStart', showLoader);
      Router.events.off('routeChangeComplete', hideLoader);
      Router.events.off('routeChangeError', hideLoader);
    };
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="페이지 이동 중">
      <div className={styles.panel}>
        <DoubleBounceLoader size={48} label="페이지 이동 중" />
        <span className={styles.label}>페이지 이동 중</span>
      </div>
    </div>
  );
}
