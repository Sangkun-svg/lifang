import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useRef, useState } from 'react';

import { CalendarIcon, ChevronDownIcon, PackageCheckIcon, PackageMinusIcon, PackagePlusIcon, SearchIcon } from '@/components/icons/AdminIcons';
import { UserLayout } from '@/components/user/UserLayout';
import { getUserSessionUser, type UserSessionUser } from '@/lib/auth/user';
import { isUserProduct, userProducts, type UserProduct } from '@/lib/user/products';

import styles from './dashboard.module.css';

type DashboardPageProps = {
  initialProduct: UserProduct;
  user: UserSessionUser;
};

type StatCard = {
  label: string;
  value: number;
  icon: 'search' | 'check' | 'plus' | 'minus';
};

type PlatformDatum = {
  name: string;
  count: number;
  color: string;
};

type ShopRank = {
  rank: string;
  shop: string;
  platform: string;
  count: string;
};

type MonthlyDatum = {
  month: string;
  counterfeit: number;
  blocked: number;
};

type ProductMonthRecord = {
  blockCompleted: number;
  blockRequested: number;
  confirmed: number;
  platforms: PlatformDatum[];
  searchCount: number;
  year: string;
  yearMonth: string;
};

type AppliedFilters = {
  endMonth: string;
  product: UserProduct;
  startMonth: string;
};

const defaultStartMonth = '2025-07';
const defaultEndMonth = '2026-04';
const platformNames = ['타오바오', '알리익스프레스', '핀둬둬', '1688', '징동 닷컴', '티몰', '쇼피', '라자다', '이베이', '기타'];
const platformColors = ['#ff2b3a', '#1084fe', '#ff932e', '#ffb15a', '#ffbe75', '#ffca8d', '#ffd4a4', '#ffdfbd', '#ffe8d3', '#4f5459'];

const baseMonthlyData: MonthlyDatum[] = [
  { month: '01', counterfeit: 264, blocked: 138 },
  { month: '02', counterfeit: 324, blocked: 138 },
  { month: '03', counterfeit: 217, blocked: 34 },
  { month: '04', counterfeit: 178, blocked: 82 },
  { month: '05', counterfeit: 51, blocked: 34 },
  { month: '06', counterfeit: 117, blocked: 83 },
  { month: '07', counterfeit: 83, blocked: 34 },
  { month: '08', counterfeit: 279, blocked: 128 },
  { month: '09', counterfeit: 117, blocked: 229 },
  { month: '10', counterfeit: 39, blocked: 8 },
  { month: '11', counterfeit: 88, blocked: 34 },
  { month: '12', counterfeit: 117, blocked: 34 },
];

const productScales: Record<UserProduct, number> = {
  공룡: 1,
  산타: 0.72,
  토끼: 1.18,
  공룡2: 0.86,
  호랑이: 1.34,
};

const productPlatformBias: Record<UserProduct, number[]> = {
  공룡: [38, 30, 24, 16, 12, 10, 8, 7, 5, 4],
  산타: [24, 36, 20, 18, 10, 9, 8, 8, 6, 5],
  토끼: [28, 18, 40, 16, 12, 10, 9, 7, 6, 4],
  공룡2: [34, 22, 24, 26, 14, 9, 8, 6, 5, 4],
  호랑이: [22, 18, 26, 14, 30, 10, 9, 8, 7, 5],
};

function createProductRecords(product: UserProduct): ProductMonthRecord[] {
  const scale = productScales[product];
  const bias = productPlatformBias[product];

  return [2025, 2026].flatMap((year) => {
    const yearScale = year === 2026 ? 0.78 : 1;

    return baseMonthlyData.map((datum, index) => {
      const monthNumber = index + 1;
      const seasonalOffset = (monthNumber % 4) * 9;
      const confirmed = Math.max(0, Math.round((datum.counterfeit + seasonalOffset) * scale * yearScale));
      const blockCompleted = Math.max(0, Math.round((datum.blocked + seasonalOffset / 2) * scale * yearScale));
      const blockRequested = Math.max(blockCompleted, Math.round(blockCompleted + confirmed * 0.22));
      const searchCount = Math.round(confirmed + blockRequested + (monthNumber + 6) * 8 * scale);
      const platformTotal = bias.reduce((sum, value) => sum + value, 0);
      const platforms = bias.map((value, platformIndex) => ({
        color: platformColors[platformIndex],
        count: Math.round((confirmed * value) / platformTotal),
        name: platformNames[platformIndex],
      }));

      return {
        blockCompleted,
        blockRequested,
        confirmed,
        platforms,
        searchCount,
        year: String(year),
        yearMonth: `${year}-${String(monthNumber).padStart(2, '0')}`,
      };
    });
  });
}

const productRecords = userProducts.reduce(
  (records, product) => ({
    ...records,
    [product]: createProductRecords(product),
  }),
  {} as Record<UserProduct, ProductMonthRecord[]>
);

function formatDateLabel(value: string) {
  const [year, month] = value.split('-');

  if (!year || !month) {
    return value;
  }

  return `${year.slice(2)}. ${month}`;
}

function normalizeMonthRange(startMonth: string, endMonth: string) {
  if (startMonth <= endMonth) {
    return { startMonth, endMonth };
  }

  return { startMonth: endMonth, endMonth: startMonth };
}

function sumPlatforms(records: ProductMonthRecord[]): PlatformDatum[] {
  return platformNames
    .map((name, index) => ({
      color: platformColors[index],
      count: records.reduce((sum, record) => sum + (record.platforms[index]?.count ?? 0), 0),
      name,
    }))
    .sort((first, second) => second.count - first.count);
}

function buildConicGradient(platforms: PlatformDatum[]) {
  const total = platforms.reduce((sum, platform) => sum + platform.count, 0);

  if (total <= 0) {
    return '#f0f2f4';
  }

  let cursor = 0;
  const segments = platforms.map((platform) => {
    const start = cursor;
    const end = cursor + (platform.count / total) * 360;
    cursor = end;
    return `${platform.color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${segments.join(', ')})`;
}

function buildShopRanks(product: UserProduct, platforms: PlatformDatum[], totalSearchCount: number): ShopRank[] {
  const prefix = product.slice(0, 1);
  const factors = [0.52, 0.49, 0.46, 0.4, 0.34, 0.24, 0.17, 0.11, 0.07, 0.04];

  return factors.map((factor, index) => {
    const platform = platforms[index % platforms.length] ?? platforms[0];

    return {
      count: `${Math.max(0, Math.round(totalSearchCount * factor)).toLocaleString('ko-KR')}개`,
      platform: platform?.name ?? '-',
      rank: `${index + 1}위`,
      shop: `${prefix}${String.fromCharCode(65 + index)}샵`,
    };
  });
}

function getDashboardData(filters: AppliedFilters, selectedYear: string) {
  const records = productRecords[filters.product];
  const rangeRecords = records.filter((record) => record.yearMonth >= filters.startMonth && record.yearMonth <= filters.endMonth);
  const platformData = sumPlatforms(rangeRecords);
  const totalPlatformCount = platformData.reduce((sum, platform) => sum + platform.count, 0);
  const totalSearchCount = rangeRecords.reduce((sum, record) => sum + record.searchCount, 0);
  const confirmedCount = rangeRecords.reduce((sum, record) => sum + record.confirmed, 0);
  const blockRequestedCount = rangeRecords.reduce((sum, record) => sum + record.blockRequested, 0);
  const blockCompletedCount = rangeRecords.reduce((sum, record) => sum + record.blockCompleted, 0);

  return {
    donutGradient: buildConicGradient(platformData),
    monthlyData: baseMonthlyData.map((datum) => {
      const yearMonth = `${selectedYear}-${datum.month}`;
      const matchingRecord = records.find((record) => record.yearMonth === yearMonth);
      const isInRange = yearMonth >= filters.startMonth && yearMonth <= filters.endMonth;

      return {
        blocked: matchingRecord && isInRange ? matchingRecord.blockCompleted : 0,
        counterfeit: matchingRecord && isInRange ? matchingRecord.confirmed : 0,
        month: datum.month,
      };
    }),
    platformPercentByName: Object.fromEntries(
      platformData.map((platform) => [
        platform.name,
        totalPlatformCount > 0 ? `${Math.round((platform.count / totalPlatformCount) * 100)}%` : '0%',
      ])
    ) as Record<string, string>,
    platformData,
    shopRanks: buildShopRanks(filters.product, platformData, totalSearchCount),
    stats: [
      { label: '총 검색 수', value: totalSearchCount, icon: 'search' },
      { label: '확정된 위조품 수', value: confirmedCount, icon: 'check' },
      { label: '차단 신청한 위조품 수', value: blockRequestedCount, icon: 'plus' },
      { label: '차단 완료된 위조품 수', value: blockCompletedCount, icon: 'minus' },
    ] satisfies StatCard[],
  };
}

function getProductFromQuery(product: string | string[] | undefined): UserProduct {
  const value = Array.isArray(product) ? product[0] : product;
  return isUserProduct(value) ? value : userProducts[0];
}

function StatIcon({ icon }: { icon: StatCard['icon'] }) {
  if (icon === 'search') {
    return <SearchIcon className={styles.statIcon} />;
  }

  if (icon === 'check') {
    return <PackageCheckIcon className={styles.statIcon} />;
  }

  if (icon === 'plus') {
    return <PackagePlusIcon className={styles.statIcon} />;
  }

  return <PackageMinusIcon className={styles.statIcon} />;
}

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

type DateControlProps = {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
};

function DateControl({ ariaLabel, value, onChange }: DateControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current as PickerInput | null;

    if (!input) {
      return;
    }

    input.focus();
    if (input.showPicker) {
      input.showPicker();
      return;
    }

    input.click();
  };

  return (
    <span className={styles.dateBox}>
      <button className={styles.dateTrigger} type="button" onClick={openPicker} aria-label={ariaLabel}>
        <span>{formatDateLabel(value)}</span>
        <CalendarIcon className={styles.controlIcon} />
      </button>
      <input
        ref={inputRef}
        className={styles.nativeDateInput}
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-hidden="true"
        tabIndex={-1}
      />
    </span>
  );
}

export const getServerSideProps: GetServerSideProps<DashboardPageProps> = async ({ query, req, res }) => {
  const user = await getUserSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialProduct: getProductFromQuery(query.product),
      user,
    },
  };
};

export default function DashboardPage({ initialProduct, user: _user }: DashboardPageProps) {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<UserProduct>(initialProduct);
  const [startMonth, setStartMonth] = useState(defaultStartMonth);
  const [endMonth, setEndMonth] = useState(defaultEndMonth);
  const [selectedYear, setSelectedYear] = useState(defaultStartMonth.slice(0, 4));
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    endMonth: defaultEndMonth,
    product: initialProduct,
    startMonth: defaultStartMonth,
  });

  const dashboardData = useMemo(
    () => getDashboardData(appliedFilters, selectedYear),
    [appliedFilters, selectedYear]
  );
  const maxMonthlyValue = useMemo(
    () => Math.max(1, ...dashboardData.monthlyData.flatMap((datum) => [datum.counterfeit, datum.blocked])),
    [dashboardData.monthlyData]
  );
  const highlightedMonth = useMemo(
    () =>
      dashboardData.monthlyData.reduce(
        (highlight, datum) => (datum.counterfeit > highlight.counterfeit ? datum : highlight),
        dashboardData.monthlyData[0]
      ),
    [dashboardData.monthlyData]
  );

  const handleSearch = () => {
    const normalizedRange = normalizeMonthRange(startMonth, endMonth);

    setStartMonth(normalizedRange.startMonth);
    setEndMonth(normalizedRange.endMonth);
    setSelectedYear(normalizedRange.startMonth.slice(0, 4));
    setAppliedFilters({
      ...normalizedRange,
      product: selectedProduct,
    });
    void router.replace({ pathname: '/dashboard', query: { product: selectedProduct } }, undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>대시보드 | LIFANG INC.</title>
      </Head>

      <UserLayout>
        <h1 className={styles.title}>대시보드</h1>

        <div className={styles.filters}>
          <label className={styles.selectGroup}>
            <span className={styles.filterLabel}>조회 상품</span>
            <span className={styles.selectBox}>
              <select
                className={styles.select}
                value={selectedProduct}
                onChange={(event) => setSelectedProduct(event.target.value as UserProduct)}
              >
                {userProducts.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className={styles.controlIcon} />
            </span>
          </label>

          <div className={styles.dateFilter} aria-label="검색 날짜">
            <span className={styles.filterLabel}>검색 날짜</span>
            <DateControl ariaLabel="검색 시작 날짜" value={startMonth} onChange={setStartMonth} />
            <span className={styles.tilde}>~</span>
            <DateControl ariaLabel="검색 종료 날짜" value={endMonth} onChange={setEndMonth} />
            <button className={styles.searchButton} type="button" onClick={handleSearch}>
              조회
            </button>
          </div>
        </div>

        <section className={styles.overview} aria-label="대시보드 요약">
          <div className={styles.statList}>
            {dashboardData.stats.map((stat) => (
              <article className={styles.statCard} key={stat.label}>
                <div className={styles.statHeader}>
                  <StatIcon icon={stat.icon} />
                  <span>{stat.label}</span>
                </div>
                <p className={styles.statValue}>
                  {stat.value.toLocaleString('ko-KR')}
                  <span>건</span>
                </p>
              </article>
            ))}
          </div>

          <article className={styles.platformCard}>
            <h2 className={styles.cardTitle}>플랫폼 별 위조품 수</h2>
            <div className={styles.platformContent}>
              <div className={styles.ratioGroup}>
                <p className={styles.subTitle}>플랫폼 별 비율</p>
                <div className={styles.donutArea}>
                  <div
                    className={styles.donutChart}
                    aria-label="플랫폼 별 비율 차트"
                    style={{ background: dashboardData.donutGradient }}
                  >
                    <span className={styles.donutCenterText}>플랫폼별 비율</span>
                  </div>
                  <div className={styles.legend}>
                    {dashboardData.platformData.map((platform, index) => (
                      <div className={styles.legendItem} key={`${platform.name}-${index}`}>
                        <span className={styles.legendDot} style={{ background: platform.color }} />
                        <span className={styles.legendName}>{platform.name}</span>
                        <span className={styles.legendPercent}>{dashboardData.platformPercentByName[platform.name]}</span>
                        <span className={styles.legendCount}>{platform.count.toLocaleString('ko-KR')}건</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.rankGroup}>
                <p className={styles.subTitle}>탑셀러</p>
                <div className={styles.rankTable} aria-label="탑셀러 순위">
                  <div className={styles.rankHeader}>
                    <span>-</span>
                    <span>위조판매상</span>
                    <span>플랫폼</span>
                    <span>판매 갯수</span>
                  </div>
                  {dashboardData.shopRanks.map((shop) => (
                    <div className={styles.rankRow} key={shop.rank}>
                      <span>{shop.rank}</span>
                      <span>{shop.shop}</span>
                      <span>{shop.platform}</span>
                      <span>{shop.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.monthlyCard} aria-label="월별 위조품 현황">
          <div className={styles.monthlyHeader}>
            <div className={styles.monthlyTitleGroup}>
              <h2 className={styles.cardTitle}>월별 위조품 현황</h2>
              <div className={styles.monthlyLegend}>
                <span>
                  <i className={styles.orangeDot} />
                  위조품 수
                </span>
                <span>
                  <i className={styles.redDot} />
                  차단 건수
                </span>
              </div>
            </div>

            <label className={styles.yearBox}>
              <span>{selectedYear}</span>
              <CalendarIcon className={styles.controlIcon} />
              <select
                className={styles.nativeYearSelect}
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                aria-label="조회 연도"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </label>
          </div>

          <div className={styles.chartArea}>
            <div className={styles.gridLines} aria-hidden="true">
              {Array.from({ length: 21 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
            <div className={styles.barGroups}>
              {dashboardData.monthlyData.map((datum) => (
                <div className={styles.barGroup} key={datum.month}>
                  {highlightedMonth.month === datum.month && datum.counterfeit > 0 ? (
                    <>
                      <span className={styles.counterfeitCallout}>
                        위조품
                        <br />
                        {datum.counterfeit.toLocaleString('ko-KR')}건
                      </span>
                      <span className={styles.blockedCallout}>
                        차단
                        <br />
                        {datum.blocked.toLocaleString('ko-KR')}건
                      </span>
                    </>
                  ) : null}
                  <div className={styles.bars}>
                    <span
                      className={styles.counterfeitBar}
                      style={{ height: `${(datum.counterfeit / maxMonthlyValue) * 264}px` }}
                    />
                    <span className={styles.blockedBar} style={{ height: `${(datum.blocked / maxMonthlyValue) * 264}px` }} />
                  </div>
                  <span className={styles.monthLabel}>{datum.month}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </UserLayout>
    </>
  );
}
