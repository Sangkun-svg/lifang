import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CalendarIcon, ChevronDownIcon } from '@/components/icons/AdminIcons';
import { getSheetRecords, getSheetSummaries, getSheetSummaryById } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { SheetRecord, SheetSummary } from '@/types/sheet';

import styles from '@/pages/products/ProductHistory.module.css';

type AdminSheetDetailPageProps = {
  records: SheetRecord[];
  sheet: SheetSummary;
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

type AppliedDateFilter = {
  endDate: string;
  startDate: string;
};

type SheetFilterField = 'price' | 'salesCount' | 'platform';

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

const sheetFilterOptions: Array<{ label: string; value: SheetFilterField }> = [
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

function normalizeDateRange(startDate: string, endDate: string): AppliedDateFilter {
  if (startDate <= endDate) {
    return { endDate, startDate };
  }

  return { endDate: startDate, startDate: endDate };
}

function sortRecords(records: SheetRecord[], field: SheetFilterField) {
  return [...records].sort((first, second) => {
    if (field === 'price') {
      return Number(second.price) - Number(first.price);
    }

    if (field === 'salesCount') {
      return second.salesCount - first.salesCount;
    }

    return first.platform.localeCompare(second.platform, 'ko-KR');
  });
}

export const getServerSideProps: GetServerSideProps<AdminSheetDetailPageProps> = async ({ query, req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  const sheetId = Array.isArray(query.sheetId) ? query.sheetId[0] : query.sheetId;

  if (!sheetId) {
    return {
      redirect: {
        destination: '/admin/sheets',
        permanent: false,
      },
    };
  }

  try {
    const [sheet, records, sheetSummaries] = await Promise.all([
      getSheetSummaryById(sheetId),
      getSheetRecords(sheetId),
      getSheetSummaries(),
    ]);

    if (!sheet) {
      return {
        redirect: {
          destination: '/admin/sheets',
          permanent: false,
        },
      };
    }

    return {
      props: {
        records,
        sheet,
        sheetSummaries,
        user,
      },
    };
  } catch (error) {
    console.error('Load sheet detail failed', error);

    return {
      redirect: {
        destination: '/admin/sheets',
        permanent: false,
      },
    };
  }
};

export default function AdminSheetDetailPage({ records, sheet, sheetSummaries }: AdminSheetDetailPageProps) {
  const initialDateRange = useMemo(() => {
    const dates = records.map((record) => record.searchDate).filter(Boolean).sort();
    const fallbackDate = '2026-04-02';

    return {
      endDate: dates[dates.length - 1] ?? fallbackDate,
      startDate: dates[0] ?? fallbackDate,
    };
  }, [records]);
  const [startDate, setStartDate] = useState(initialDateRange.startDate);
  const [endDate, setEndDate] = useState(initialDateRange.endDate);
  const [appliedDateFilter, setAppliedDateFilter] = useState<AppliedDateFilter>(initialDateRange);
  const [filterField, setFilterField] = useState<SheetFilterField>('price');

  const visibleRecords = useMemo(() => {
    const filteredRecords = records.filter(
      (record) => record.searchDate >= appliedDateFilter.startDate && record.searchDate <= appliedDateFilter.endDate
    );

    return sortRecords(filteredRecords, filterField);
  }, [appliedDateFilter.endDate, appliedDateFilter.startDate, filterField, records]);

  const handleRefresh = () => {
    const normalizedDateRange = normalizeDateRange(startDate, endDate);

    setStartDate(normalizedDateRange.startDate);
    setEndDate(normalizedDateRange.endDate);
    setAppliedDateFilter(normalizedDateRange);
  };

  return (
    <>
      <Head>
        <title>{sheet.name} | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.listPage}>
          <header className={styles.listHeader}>
            <h1 className={styles.pageTitle}>{sheet.name}</h1>

            <div className={styles.filterBar}>
              <label className={styles.selectGroup}>
                <span className={styles.filterLabel}>필터</span>
                <span className={styles.selectBox}>
                  <select
                    className={styles.select}
                    value={filterField}
                    onChange={(event) => setFilterField(event.target.value as SheetFilterField)}
                  >
                    {sheetFilterOptions.map((option) => (
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

          <section className={styles.historyTable} aria-label={`${sheet.name} 내역목록`}>
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
              {visibleRecords.map((record, index) => (
                <div className={styles.tableRow} key={record.id}>
                  <span className={styles.indexCell}>{String(index + 1).padStart(2, '0')}</span>
                  <span className={styles.statusCell} data-status={record.status}>
                    <i />
                    {record.status}
                  </span>
                  <span className={styles.dateCell}>{record.displayDate}</span>
                  <span className={styles.imageCell}>
                    {record.imageUrl ? (
                      <img className={styles.productThumbnail} src={record.imageUrl} alt={`${record.productName} 제품`} />
                    ) : (
                      '-'
                    )}
                  </span>
                  <span className={styles.platformCell}>{record.platform || record.category || '-'}</span>
                  <span className={styles.productNameCell}>{record.productName}</span>
                  <span className={styles.companyCell}>{record.companyName || '-'}</span>
                  <span className={styles.priceCell}>{record.price}</span>
                  <span className={styles.quantityCell}>{record.salesCount}</span>
                  <span className={styles.linkCell}>
                    {record.salesUrl ? (
                      <a className={styles.tableLink} href={record.salesUrl} target="_blank" rel="noreferrer">
                        이동
                      </a>
                    ) : (
                      '-'
                    )}
                  </span>
                  <span className={styles.requestCell}>-</span>
                  <span className={styles.detailCell}>
                    <Link className={styles.tableLink} href={record.salesUrl || `/admin/sheets/${sheet.id}`}>
                      보기
                    </Link>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </AdminLayout>
    </>
  );
}
