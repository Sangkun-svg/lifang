import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.customerColumn}>
          <div className={styles.logoWrap}>
            <img className={styles.logo} src="/assets/lifang-logo-footer.svg" alt="LIFANG INC." />
          </div>

          <div className={styles.customerInfo}>
            <p className={styles.bold}>고객센터</p>
            <div className={styles.textBlock}>
              <p>전화번호 : 02-6959-0780</p>
              <p>주중 09~18시 (점심시간 12:00 ~ 13:30 / 주말 및 공휴일 제외)</p>
            </div>
          </div>
        </div>

        <div className={styles.companyColumn}>
          <p>대표: 박근확</p>
          <p>사업자등록번호 : 289-86-03792</p>
          <p>주소 : 서울시 강서구 마곡중앙8로7길 57, 마곡아이파크디어반 B동 316호</p>
          <p>메일 : khpark@lifang.kr</p>
          <p className={styles.bold}>Copyright © 2026 LIFANG INC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
