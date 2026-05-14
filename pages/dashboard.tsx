import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import AirDatepicker from 'air-datepicker';
import localeKo from 'air-datepicker/locale/ko';

import {
  CalendarIcon,
  ChevronDownIcon,
  PackageCheckIcon,
  PackageMinusIcon,
  PackagePlusIcon,
  SearchIcon,
} from '@/components/icons/AdminIcons';
import { UserLayout } from '@/components/user/UserLayout';
import { getUserSessionUser, type UserSessionUser } from '@/lib/auth/user';
import {
  getProductFromParam,
  getProductHistoryItems,
  getProductLabel,
  getScopedUserProductSummaries,
  type ProductHistoryItem,
  type UserProduct,
  type UserProductSummary,
} from '@/lib/user/productHistory';
import { getInitialSearchMonthRange } from '@/lib/date/defaultRange';

import styles from './dashboard.module.css';

type DashboardPageProps = {
  initialProduct: UserProduct;
  items: ProductHistoryItem[];
  products: UserProductSummary[];
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
  percent: number;
  percentLabel: string;
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

type AppliedFilters = {
  endMonth: string;
  product: UserProduct;
  startMonth: string;
};

const platformColors = ['#ff2b3a', '#1084fe', '#ff932e', '#ffb15a', '#ffbe75', '#ffca8d', '#ffd4a4', '#ffdfbd', '#ffe8d3', '#4f5459'];
const maxPlatformChartItems = 10;
const months = Array.from({ length: 12 }).map((_, index) => String(index + 1).padStart(2, '0'));

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

function getSearchMonth(item: ProductHistoryItem) {
  return item.searchDate ? item.searchDate.slice(0, 7) : '';
}

function getPlatformData(items: ProductHistoryItem[]): PlatformDatum[] {
  const counts = items.reduce<Record<string, number>>((platformCounts, item) => {
    const platform = item.platform || '기타';

    return {
      ...platformCounts,
      [platform]: (platformCounts[platform] ?? 0) + 1,
    };
  }, {});

  return Object.entries(counts)
    .sort((first, second) => second[1] - first[1])
    .slice(0, maxPlatformChartItems)
    .map(([name, count], index) => ({
      color: platformColors[index % platformColors.length],
      count,
      name,
      percent: 0,
      percentLabel: '0%',
    }));
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

function buildShopRanks(items: ProductHistoryItem[]): ShopRank[] {
  const counts = items.reduce<Record<string, { count: number; platform: string; shop: string }>>((shopCounts, item) => {
    const shop = item.companyName || '-';
    const key = `${shop}:${item.platform}`;
    const previous = shopCounts[key];

    return {
      ...shopCounts,
      [key]: {
        count: (previous?.count ?? 0) + Math.max(item.salesCount, 1),
        platform: item.platform || '-',
        shop,
      },
    };
  }, {});

  return Object.values(counts)
    .sort((first, second) => second.count - first.count)
    .slice(0, 10)
    .map((shop, index) => ({
      count: `${shop.count.toLocaleString('ko-KR')}개`,
      platform: shop.platform,
      rank: `${index + 1}위`,
      shop: shop.shop,
    }));
}

function getDashboardData(items: ProductHistoryItem[], filters: AppliedFilters, selectedYear: string) {
  const rangeItems = items.filter((item) => {
    const searchMonth = getSearchMonth(item);

    return searchMonth >= filters.startMonth && searchMonth <= filters.endMonth;
  });
  const platformData = getPlatformData(rangeItems);
  const totalPlatformCount = platformData.reduce((sum, platform) => sum + platform.count, 0);
  const platformDataWithPercent = platformData.map((platform) => {
    const percent = totalPlatformCount > 0 ? Math.round((platform.count / totalPlatformCount) * 100) : 0;

    return {
      ...platform,
      percent,
      percentLabel: `${percent}%`,
    };
  });
  const blockRequestedCount = rangeItems.filter((item) => item.blockRequested).length;
  const blockCompletedCount = rangeItems.filter((item) => item.status === '차단완료').length;

  return {
    donutGradient: buildConicGradient(platformDataWithPercent),
    monthlyData: months.map((month) => {
      const yearMonth = `${selectedYear}-${month}`;
      const monthItems = rangeItems.filter((item) => getSearchMonth(item) === yearMonth);

      return {
        blocked: monthItems.filter((item) => item.status === '차단완료').length,
        counterfeit: monthItems.length,
        month,
      };
    }),
    platformData: platformDataWithPercent,
    shopRanks: buildShopRanks(rangeItems),
    stats: [
      { label: '총 검색 수', value: rangeItems.length, icon: 'search' },
      { label: '확정된 위조품 수', value: rangeItems.length, icon: 'check' },
      { label: '차단 신청한 위조품 수', value: blockRequestedCount, icon: 'plus' },
      { label: '차단 완료된 위조품 수', value: blockCompletedCount, icon: 'minus' },
    ] satisfies StatCard[],
  };
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

function PlatformDonutChart({ platforms }: { platforms: PlatformDatum[] }) {
  const [hoveredPlatform, setHoveredPlatform] = useState<PlatformDatum | null>(null);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={styles.donutChart} aria-label="플랫폼 별 비율 차트">
      <svg className={styles.donutSvg} viewBox="0 0 200 200" role="img">
        <circle className={styles.donutTrack} cx="100" cy="100" r={radius} />
        {platforms.map((platform) => {
          const segmentLength = (platform.percent / 100) * circumference;
          const segmentOffset = offset;
          offset += segmentLength;

          return (
            <circle
              className={styles.donutSegment}
              cx="100"
              cy="100"
              key={platform.name}
              r={radius}
              stroke={platform.color}
              strokeDasharray={`${segmentLength} ${circumference}`}
              strokeDashoffset={-segmentOffset}
              transform="rotate(-90 100 100)"
              onMouseEnter={() => setHoveredPlatform(platform)}
              onMouseLeave={() => setHoveredPlatform(null)}
              onFocus={() => setHoveredPlatform(platform)}
              onBlur={() => setHoveredPlatform(null)}
              tabIndex={0}
            />
          );
        })}
      </svg>
      {hoveredPlatform ? (
        <span className={styles.chartTooltip} style={{ backgroundColor: hoveredPlatform.color }} role="status">
          <span>{hoveredPlatform.name}</span>
          <strong>{hoveredPlatform.percentLabel}</strong>
        </span>
      ) : null}
    </div>
  );
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

function YearControl({ ariaLabel, value, onChange }: DateControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<AirDatepicker<HTMLInputElement> | null>(null);

  const openPicker = () => {
    pickerRef.current?.show();
  };

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const selectedDate = new Date(Number(value), 0, 1);
    const datepicker = new AirDatepicker(input, {
      autoClose: true,
      classes: 'lifang-year-picker',
      dateFormat: 'yyyy',
      locale: localeKo,
      minView: 'years',
      navTitles: {
        years: 'yyyy1 - yyyy2',
      },
      offset: 8,
      onSelect: ({ date }) => {
        const selectedDateValue = Array.isArray(date) ? date[0] : date;

        if (selectedDateValue) {
          onChange(String(selectedDateValue.getFullYear()));
        }
      },
      container: document.body,
      position: ({ $datepicker, $target }) => {
        const viewportGap = 16;
        const targetRect = $target.getBoundingClientRect();
        const pickerWidth = $datepicker.offsetWidth || 280;
        const pickerHeight = $datepicker.offsetHeight || 0;
        const left = Math.max(
          viewportGap,
          Math.min(targetRect.right - pickerWidth, window.innerWidth - pickerWidth - viewportGap)
        );
        const hasBottomSpace = targetRect.bottom + pickerHeight + viewportGap <= window.innerHeight;
        const top = hasBottomSpace
          ? targetRect.bottom + 8
          : Math.max(viewportGap, targetRect.top - pickerHeight - 8);

        $datepicker.style.left = `${left + window.scrollX}px`;
        $datepicker.style.top = `${top + window.scrollY}px`;
      },
      selectedDates: [selectedDate],
      startDate: selectedDate,
      view: 'years',
    });

    pickerRef.current = datepicker;

    return () => {
      datepicker.destroy();
      pickerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const nextDate = new Date(Number(value), 0, 1);

    if (pickerRef.current && !Number.isNaN(nextDate.getTime())) {
      pickerRef.current.update({
        selectedDates: [nextDate],
        startDate: nextDate,
        view: 'years',
      }, { silent: true });
    }
  }, [value]);

  return (
    <span className={styles.yearBox}>
      <button className={styles.dateTrigger} type="button" onClick={openPicker} aria-label={ariaLabel}>
        <span>{value}</span>
        <CalendarIcon className={styles.controlIcon} />
      </button>
      <input
        ref={inputRef}
        className={styles.nativeYearInput}
        type="text"
        value={value}
        readOnly
        aria-label={ariaLabel}
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

  try {
    const products = await getScopedUserProductSummaries(user);
    const initialProduct = getProductFromParam(query.product, products);
    const items = await getProductHistoryItems(initialProduct, products);

    return {
      props: {
        initialProduct,
        items,
        products,
        user,
      },
    };
  } catch (error) {
    console.error('Load user dashboard data failed', error);

    return {
      props: {
        initialProduct: '',
        items: [],
        products: [],
        user,
      },
    };
  }
};

export default function DashboardPage({ initialProduct, items, products, user: _user }: DashboardPageProps) {
  const router = useRouter();
  const initialRange = useMemo(() => getInitialSearchMonthRange(items), [items]);
  const [selectedProduct, setSelectedProduct] = useState<UserProduct>(initialProduct);
  const [startMonth, setStartMonth] = useState(initialRange.startMonth);
  const [endMonth, setEndMonth] = useState(initialRange.endMonth);
  const [selectedYear, setSelectedYear] = useState(initialRange.endMonth.slice(0, 4));
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    endMonth: initialRange.endMonth,
    product: initialProduct,
    startMonth: initialRange.startMonth,
  });

  useEffect(() => {
    setSelectedProduct(initialProduct);
    setStartMonth(initialRange.startMonth);
    setEndMonth(initialRange.endMonth);
    setSelectedYear(initialRange.endMonth.slice(0, 4));
    setAppliedFilters({
      endMonth: initialRange.endMonth,
      product: initialProduct,
      startMonth: initialRange.startMonth,
    });
  }, [initialProduct, initialRange]);

  const dashboardData = useMemo(() => getDashboardData(items, appliedFilters, selectedYear), [appliedFilters, items, selectedYear]);
  const maxMonthlyValue = useMemo(
    () => Math.max(1, ...dashboardData.monthlyData.flatMap((datum) => [datum.counterfeit, datum.blocked])),
    [dashboardData.monthlyData]
  );

  const handleSearch = () => {
    if (selectedProduct && selectedProduct !== appliedFilters.product) {
      void router.replace({ pathname: '/dashboard', query: { product: selectedProduct } });
      return;
    }

    const normalizedRange = normalizeMonthRange(startMonth, endMonth);

    setStartMonth(normalizedRange.startMonth);
    setEndMonth(normalizedRange.endMonth);
    setSelectedYear(normalizedRange.endMonth.slice(0, 4));
    setAppliedFilters({
      ...normalizedRange,
      product: selectedProduct,
    });
  };

  const handleProductChange = (nextProduct: UserProduct) => {
    setSelectedProduct(nextProduct);

    if (nextProduct && nextProduct !== initialProduct) {
      void router.replace({ pathname: '/dashboard', query: { product: nextProduct } });
    }
  };

  return (
    <>
      <Head>
        <title>대시보드 | LIFANG INC.</title>
      </Head>

      <UserLayout accountEmail={_user.email} products={products}>
        <h1 className={styles.title}>대시보드</h1>

        <div className={styles.filters}>
          <label className={styles.selectGroup}>
            <span className={styles.filterLabel}>조회 상품</span>
            <span className={styles.selectBox}>
              <select
                className={styles.select}
                value={selectedProduct}
                onChange={(event) => handleProductChange(event.target.value)}
                disabled={products.length === 0}
              >
                {products.length > 0 ? (
                  products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))
                ) : (
                  <option value="">업로드된 시트 없음</option>
                )}
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

        <section className={styles.overview} aria-label={`${getProductLabel(appliedFilters.product, products)} 대시보드 요약`}>
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
                  <PlatformDonutChart platforms={dashboardData.platformData} />
                  <div className={styles.legend}>
                    {dashboardData.platformData.length > 0 ? (
                      dashboardData.platformData.map((platform, index) => (
                        <div className={styles.legendItem} key={`${platform.name}-${index}`}>
                          <span className={styles.legendDot} style={{ background: platform.color }} />
                          <span className={styles.legendName}>{platform.name}</span>
                          <span className={styles.legendCount}>{platform.count.toLocaleString('ko-KR')}건</span>
                        </div>
                      ))
                    ) : (
                      <p className={styles.emptyState}>표시할 데이터가 없습니다.</p>
                    )}
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
                  {dashboardData.shopRanks.length > 0 ? (
                    dashboardData.shopRanks.map((shop) => (
                      <div className={styles.rankRow} key={`${shop.rank}-${shop.shop}`}>
                        <span>{shop.rank}</span>
                        <span>{shop.shop}</span>
                        <span>{shop.platform}</span>
                        <span>{shop.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.emptyState}>표시할 데이터가 없습니다.</p>
                  )}
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

            <YearControl ariaLabel="조회 연도" value={selectedYear} onChange={setSelectedYear} />
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
                  <div className={styles.bars}>
                    <span
                      className={styles.counterfeitBar}
                      style={{ height: `${(datum.counterfeit / maxMonthlyValue) * 264}px` }}
                      role="img"
                      aria-label={`${Number(datum.month)}월 위조품 수 ${datum.counterfeit.toLocaleString('ko-KR')}건`}
                      tabIndex={datum.counterfeit > 0 ? 0 : -1}
                    >
                      {datum.counterfeit > 0 ? (
                        <span className={styles.chartTooltip} style={{ backgroundColor: '#ff932e' }}>
                          <span>{Number(datum.month)}월 위조품 수</span>
                          <strong>{datum.counterfeit.toLocaleString('ko-KR')}건</strong>
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={styles.blockedBar}
                      style={{ height: `${(datum.blocked / maxMonthlyValue) * 264}px` }}
                      role="img"
                      aria-label={`${Number(datum.month)}월 차단 건수 ${datum.blocked.toLocaleString('ko-KR')}건`}
                      tabIndex={datum.blocked > 0 ? 0 : -1}
                    >
                      {datum.blocked > 0 ? (
                        <span className={styles.chartTooltip} style={{ backgroundColor: '#ff2b3a' }}>
                          <span>{Number(datum.month)}월 차단 건수</span>
                          <strong>{datum.blocked.toLocaleString('ko-KR')}건</strong>
                        </span>
                      ) : null}
                    </span>
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
