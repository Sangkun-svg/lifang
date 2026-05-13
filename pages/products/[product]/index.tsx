import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { CalendarIcon, ChevronDownIcon } from '@/components/icons/AdminIcons';
import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';
import { UserLayout } from '@/components/user/UserLayout';
import type { ApiResponse } from '@/lib/api/responses';
import { getUserSessionUser } from '@/lib/auth/user';
import {
  filterProductHistoryItems,
  getProductFromParam,
  getProductHistoryItems,
  productHistoryPageSize,
  type ProductHistoryItem,
  type ProductHistoryStatus,
} from '@/lib/user/productHistory';
import type { UserProduct } from '@/lib/user/products';
import type { AdminRequest } from '@/types/adminRequest';

import styles from '../ProductHistory.module.css';

type ProductHistoryListPageProps = {
  initialPage: number;
  items: ProductHistoryItem[];
  product: UserProduct;
};

type AppliedDateFilter = {
  endDate: string;
  startDate: string;
};

type CreateRequestResponse = {
  request: AdminRequest;
};

type ProductFilterField = 'price' | 'salesCount' | 'platform';

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

const productFilterOptions: Array<{ label: string; value: ProductFilterField }> = [
  { label: '판매가', value: 'price' },
  { label: '판매수량', value: 'salesCount' },
  { label: '플랫폼', value: 'platform' },
];

function formatDateLabel(value: string) {
  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${year.slice(2)}. ${month}. ${day}`;
}

function DateControl({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const input = inputRef.current as PickerInput | null;

    if (!input) {
      return;
    }

    input.focus();

    try {
      input.showPicker?.();
    } catch {
      input.click();
    }
  };

  return (
    <span className={styles.dateControl}>
      <button className={styles.dateButton} type="button" onClick={openPicker} aria-label={ariaLabel}>
        <span>{formatDateLabel(value)}</span>
        <CalendarIcon className={styles.dateIcon} />
      </button>
      <input
        ref={inputRef}
        className={styles.nativeDateInput}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        tabIndex={-1}
      />
    </span>
  );
}

function normalizePage(value: string | string[] | undefined) {
  const pageValue = Array.isArray(value) ? value[0] : value;
  const parsedPage = Number(pageValue);

  return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
}

function normalizeDateRange(startDate: string, endDate: string): AppliedDateFilter {
  if (startDate <= endDate) {
    return { endDate, startDate };
  }

  return { endDate: startDate, startDate: endDate };
}

function getRowStatus(item: ProductHistoryItem, requestedById: Record<string, boolean>): ProductHistoryStatus {
  const isRequested = requestedById[item.id] ?? item.blockRequested;

  if (!isRequested) {
    return '미신청';
  }

  return item.status === '차단완료' ? '차단완료' : '신고완료';
}

function sortItemsByFilterField(items: ProductHistoryItem[], filterField: ProductFilterField) {
  return [...items].sort((first, second) => {
    if (filterField === 'price') {
      return Number(second.price) - Number(first.price);
    }

    if (filterField === 'salesCount') {
      return second.salesCount - first.salesCount;
    }

    return first.platform.localeCompare(second.platform, 'ko-KR');
  });
}

function CheckboxMarkIcon() {
  return (
    <svg className={styles.checkboxIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect className={styles.checkboxIconBox} width="24" height="24" rx="8" />
      <path
        className={styles.checkboxIconCheck}
        d="M16.8002 8.40002L9.64068 15.6L7.2002 13.1457"
        stroke="#FEFEFE"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PaginationChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const path = direction === 'left' ? 'M15 17L10 12L15 7' : 'M10 7L15 12L10 17';

  return (
    <svg className={styles.paginationIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export const getServerSideProps: GetServerSideProps<ProductHistoryListPageProps> = async ({ query, req, res }) => {
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

  return {
    props: {
      initialPage: normalizePage(query.page),
      items: getProductHistoryItems(product),
      product,
    },
  };
};

export default function ProductHistoryListPage({ initialPage, items, product }: ProductHistoryListPageProps) {
  const [startDate, setStartDate] = useState('2026-04-02');
  const [endDate, setEndDate] = useState('2026-04-02');
  const [appliedDateFilter, setAppliedDateFilter] = useState<AppliedDateFilter>({
    endDate: '2026-04-02',
    startDate: '2026-04-02',
  });
  const [filterField, setFilterField] = useState<ProductFilterField>('price');
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [requestedById, setRequestedById] = useState<Record<string, boolean>>(() =>
    items.reduce(
      (requests, item) => ({
        ...requests,
        [item.id]: item.blockRequested,
      }),
      {}
    )
  );
  const [requestingById, setRequestingById] = useState<Record<string, boolean>>({});
  const [requestError, setRequestError] = useState('');

  const filteredItems = useMemo(
    () => sortItemsByFilterField(filterProductHistoryItems(items, appliedDateFilter.startDate, appliedDateFilter.endDate), filterField),
    [appliedDateFilter.endDate, appliedDateFilter.startDate, filterField, items]
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / productHistoryPageSize));
  const page = Math.min(currentPage, totalPages);
  const visibleItems = filteredItems.slice((page - 1) * productHistoryPageSize, page * productHistoryPageSize);
  const pageNumbers = Array.from({ length: totalPages }).map((_, index) => index + 1);

  const handleRefresh = () => {
    const normalizedDateRange = normalizeDateRange(startDate, endDate);

    setStartDate(normalizedDateRange.startDate);
    setEndDate(normalizedDateRange.endDate);
    setAppliedDateFilter(normalizedDateRange);
    setCurrentPage(1);
  };

  const handleBlockRequest = async (itemId: string, checked: boolean) => {
    if (requestingById[itemId]) {
      return;
    }

    setRequestedById((requests) => ({
      ...requests,
      [itemId]: checked,
    }));
    setRequestError('');

    if (!checked) {
      return;
    }

    setRequestingById((requests) => ({
      ...requests,
      [itemId]: true,
    }));

    try {
      const response = await fetch('/api/user/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          product,
        }),
      });
      const payload = (await response.json()) as ApiResponse<CreateRequestResponse>;

      if (!response.ok || !payload.ok) {
        setRequestedById((requests) => ({
          ...requests,
          [itemId]: false,
        }));
        setRequestError(payload.ok ? '요청 저장 중 문제가 발생했습니다.' : payload.message);
      }
    } catch {
      setRequestedById((requests) => ({
        ...requests,
        [itemId]: false,
      }));
      setRequestError('요청 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setRequestingById((requests) => ({
        ...requests,
        [itemId]: false,
      }));
    }
  };

  return (
    <>
      <Head>
        <title>{product} 내역목록 | LIFANG INC.</title>
      </Head>

      <UserLayout>
        <div className={styles.listPage}>
          <header className={styles.listHeader}>
            <h1 className={styles.pageTitle}>내역목록</h1>

            <div className={styles.filterBar}>
              <label className={styles.selectGroup}>
                <span className={styles.filterLabel}>필터</span>
                <span className={styles.selectBox}>
                  <select
                    className={styles.select}
                    value={filterField}
                    onChange={(event) => {
                      setFilterField(event.target.value as ProductFilterField);
                      setCurrentPage(1);
                    }}
                  >
                    {productFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className={styles.selectIcon} />
                </span>
              </label>

              <span className={styles.filterLabel}>검색 날짜</span>
              <DateControl ariaLabel="검색 시작 날짜" value={startDate} onChange={setStartDate} />
              <span className={styles.tilde}>~</span>
              <DateControl ariaLabel="검색 종료 날짜" value={endDate} onChange={setEndDate} />
              <button className={styles.refreshButton} type="button" onClick={handleRefresh}>
                새로고침
              </button>
            </div>
          </header>

          <section className={styles.historyTable} aria-label={`${product} 내역목록`}>
            {requestError ? (
              <p className={styles.inlineError} role="alert">
                {requestError}
              </p>
            ) : null}

            <div className={styles.tableHeader}>
              <span className={styles.indexCell}>순번</span>
              <span className={styles.statusCell}>진행 상황</span>
              <span className={styles.dateCell}>검색 날짜</span>
              <span className={styles.imageCell}>침해 제품사진</span>
              <span className={styles.platformCell}>침해 플랫폼</span>
              <span className={styles.productNameCell}>침해 제품명</span>
              <span className={styles.companyCell}>침해 업체명칭</span>
              <span className={styles.priceCell}>판매가￥</span>
              <span className={styles.quantityCell}>판매수량</span>
              <span className={styles.linkCell}>판매링크</span>
              <span className={styles.requestCell}>차단 신청</span>
              <span className={styles.detailCell}>상세정보</span>
            </div>

            <div className={styles.tableRows}>
              {visibleItems.map((item, index) => {
                const rowStatus = getRowStatus(item, requestedById);
                const isRequested = requestedById[item.id] ?? item.blockRequested;
                const isRequesting = requestingById[item.id] ?? false;
                const rowNumber = String((page - 1) * productHistoryPageSize + index + 1).padStart(2, '0');

                return (
                  <div className={styles.tableRow} key={item.id}>
                    <span className={styles.indexCell}>{rowNumber}</span>
                    <span className={styles.statusCell} data-status={rowStatus}>
                      <i />
                      {rowStatus}
                    </span>
                    <span className={styles.dateCell}>{item.displayDate}</span>
                    <span className={styles.imageCell}>
                      <img className={styles.productThumbnail} src={item.imageUrl} alt={`${product} 침해 제품`} />
                    </span>
                    <span className={styles.platformCell}>{item.platform}</span>
                    <span className={styles.productNameCell}>{item.productName}</span>
                    <span className={styles.companyCell}>{item.companyName}</span>
                    <span className={styles.priceCell}>{item.price}</span>
                    <span className={styles.quantityCell}>{item.salesCount}</span>
                    <span className={styles.linkCell}>
                      <a className={styles.tableLink} href={item.salesUrl} target="_blank" rel="noreferrer">
                        이동
                      </a>
                    </span>
                    <span className={styles.requestCell}>
                      <label className={styles.checkboxLabel}>
                        <input
                          checked={isRequested}
                          className={styles.checkboxInput}
                          disabled={isRequesting}
                          type="checkbox"
                          onChange={(event) => handleBlockRequest(item.id, event.target.checked)}
                          aria-label={`${rowNumber}번 차단 신청`}
                        />
                        <span className={styles.checkboxMark}>
                          <CheckboxMarkIcon />
                        </span>
                        {isRequesting ? (
                          <DoubleBounceLoader
                            className={styles.checkboxLoader}
                            size={18}
                            label={`${rowNumber}번 차단 신청 저장 중`}
                          />
                        ) : null}
                      </label>
                    </span>
                    <span className={styles.detailCell}>
                      <Link className={styles.tableLink} href={`/products/${encodeURIComponent(product)}/${encodeURIComponent(item.id)}`}>
                        보기
                      </Link>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <nav className={styles.pagination} aria-label="내역목록 페이지네이션">
            <button
              type="button"
              onClick={() => setCurrentPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="이전 페이지"
            >
              <PaginationChevronIcon direction="left" />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                data-active={pageNumber === page}
                key={pageNumber}
                aria-label={`${pageNumber} 페이지`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label="다음 페이지"
            >
              <PaginationChevronIcon direction="right" />
            </button>
          </nav>
        </div>
      </UserLayout>
    </>
  );
}
