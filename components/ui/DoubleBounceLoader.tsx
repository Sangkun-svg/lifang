import type { CSSProperties } from 'react';

import styles from './DoubleBounceLoader.module.css';

type DoubleBounceLoaderProps = {
  className?: string;
  label?: string;
  size?: number;
  variant?: 'main' | 'light';
};

export function DoubleBounceLoader({
  className,
  label = '처리 중',
  size = 60,
  variant = 'main',
}: DoubleBounceLoaderProps) {
  const loaderStyle = {
    '--loader-size': `${size}px`,
  } as CSSProperties;
  const classNames = [styles.spinner, variant === 'light' ? styles.light : styles.main, className].filter(Boolean).join(' ');

  return (
    <span className={classNames} style={loaderStyle} role="status" aria-label={label}>
      <span className={styles.doubleBounce1} />
      <span className={styles.doubleBounce2} />
    </span>
  );
}
