import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CalendarIcon, ChevronDownIcon } from '@/components/icons/AdminIcons';
import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';
import type { ApiResponse } from '@/lib/api/responses';
import { getSheetRecords, getSheetSummaries, getSheetSummaryById } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import { getInitialSearchDateRange } from '@/lib/date/defaultRange';
import type { SheetRecord, SheetRecordStatus, SheetSummary } from '@/types/sheet';

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

type SheetFilterField = 'rowIndex' | 'price' | 'salesCount' | 'platform';
type SheetStatusFilter = SheetRecordStatus | 'all';

type NewSheetRecordForm = {
  companyName: string;
  imageUrl: string;
  platform: string;
  price: string;
  productName: string;
  salesCount: string;
  salesUrl: string;
  searchDate: string;
  status: SheetRecordStatus;
};

type PickerInput = HTMLInputElement & {
  showPicker?: () => void;
};

const sheetFilterOptions: Array<{ label: string; value: SheetFilterField }> = [
  { label: '순번', value: 'rowIndex' },
  { label: '판매가', value: 'price' },
  { label: '판매수량', value: 'salesCount' },
  { label: '플랫폼', value: 'platform' },
];

const sheetStatusFilterOptions: Array<{ label: string; value: SheetStatusFilter }> = [
  { label: '전체', value: 'all' },
  { label: '미신청', value: '미신청' },
  { label: '신고완료', value: '신고완료' },
  { label: '차단완료', value: '차단완료' },
];

const emptyNewRecordForm: NewSheetRecordForm = {
  companyName: '',
  imageUrl: '',
  platform: '',
  price: '',
  productName: '',
  salesCount: '0',
  salesUrl: '',
  searchDate: '',
  status: '미신청',
};

type CreateSheetRecordResponse = {
  record: SheetRecord;
};

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
    if (field === 'rowIndex') {
      return first.rowIndex - second.rowIndex;
    }

    if (field === 'price') {
      return parseIntegerInput(second.price) - parseIntegerInput(first.price);
    }

    if (field === 'salesCount') {
      return second.salesCount - first.salesCount;
    }

    return first.platform.localeCompare(second.platform, 'ko-KR');
  });
}

function formatIntegerInput(value: string) {
  const digits = value.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return Number(digits).toLocaleString('ko-KR');
}

function parseIntegerInput(value: string) {
  const digits = value.replace(/\D/g, '');

  return digits ? Number(digits) : 0;
}

function getInitialSheetSearchDateRange(records: SheetRecord[]): AppliedDateFilter {
  const fallbackRange = getInitialSearchDateRange(records);
  const dates = records
    .map((record) => record.searchDate)
    .filter((searchDate): searchDate is string => Boolean(searchDate))
    .sort();

  if (dates.length === 0) {
    return fallbackRange;
  }

  return {
    endDate: dates[dates.length - 1] ?? fallbackRange.endDate,
    startDate: dates[0] ?? fallbackRange.startDate,
  };
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
  const addSearchDateRef = useRef<HTMLInputElement>(null);
  const [currentRecords, setCurrentRecords] = useState(records);
  const initialDateRange = useMemo(() => getInitialSheetSearchDateRange(currentRecords), [currentRecords]);
  const [startDate, setStartDate] = useState(initialDateRange.startDate);
  const [endDate, setEndDate] = useState(initialDateRange.endDate);
  const [appliedDateFilter, setAppliedDateFilter] = useState<AppliedDateFilter>(initialDateRange);
  const [filterField, setFilterField] = useState<SheetFilterField>('rowIndex');
  const [statusFilter, setStatusFilter] = useState<SheetStatusFilter>('all');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState<NewSheetRecordForm>(emptyNewRecordForm);
  const [addErrorMessage, setAddErrorMessage] = useState('');
  const [addSuccessMessage, setAddSuccessMessage] = useState('');
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [temporaryNewRecordIds, setTemporaryNewRecordIds] = useState<string[]>([]);

  useEffect(() => {
    setCurrentRecords(records);
    setTemporaryNewRecordIds([]);
  }, [records, sheet.id]);

  useEffect(() => {
    setStartDate(initialDateRange.startDate);
    setEndDate(initialDateRange.endDate);
    setAppliedDateFilter(initialDateRange);
  }, [initialDateRange, sheet.id]);

  const visibleRecords = useMemo(() => {
    const filteredRecords = currentRecords.filter((record) => {
      const matchesDate =
        !record.searchDate || (record.searchDate >= appliedDateFilter.startDate && record.searchDate <= appliedDateFilter.endDate);
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      return matchesDate && matchesStatus;
    });

    if (temporaryNewRecordIds.length === 0) {
      return sortRecords(filteredRecords, filterField);
    }

    const temporaryNewRecordIdSet = new Set(temporaryNewRecordIds);
    const temporaryNewRecordOrder = new Map(temporaryNewRecordIds.map((recordId, index) => [recordId, index]));
    const newRecords = filteredRecords
      .filter((record) => temporaryNewRecordIdSet.has(record.id))
      .sort((first, second) => (temporaryNewRecordOrder.get(first.id) ?? 0) - (temporaryNewRecordOrder.get(second.id) ?? 0));
    const regularRecords = filteredRecords.filter((record) => !temporaryNewRecordIdSet.has(record.id));

    return [...newRecords, ...sortRecords(regularRecords, filterField)];
  }, [appliedDateFilter.endDate, appliedDateFilter.startDate, currentRecords, filterField, statusFilter, temporaryNewRecordIds]);

  const handleRefresh = () => {
    const normalizedDateRange = normalizeDateRange(startDate, endDate);

    setStartDate(normalizedDateRange.startDate);
    setEndDate(normalizedDateRange.endDate);
    setAppliedDateFilter(normalizedDateRange);
    setFilterField('rowIndex');
    setTemporaryNewRecordIds([]);
  };

  const openAddSearchDatePicker = () => {
    const input = addSearchDateRef.current as PickerInput | null;

    if (!input) {
      return;
    }

    try {
      input.showPicker?.();
    } catch {
      input.click();
    }
  };

  const updateNewRecordField = <Field extends keyof NewSheetRecordForm>(field: Field, value: NewSheetRecordForm[Field]) => {
    setNewRecordForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setAddErrorMessage('');
    setAddSuccessMessage('');
  };

  const handleAddRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isAddingRecord) {
      return;
    }

    if (!newRecordForm.productName.trim()) {
      setAddErrorMessage('침해 제품명을 입력해주세요.');
      return;
    }

    setIsAddingRecord(true);
    setAddErrorMessage('');
    setAddSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/sheets/${encodeURIComponent(sheet.id)}/records`, {
        body: JSON.stringify({
          ...newRecordForm,
          salesCount: parseIntegerInput(newRecordForm.salesCount),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });
      const payload = (await response.json()) as ApiResponse<CreateSheetRecordResponse>;

      if (!response.ok || !payload.ok) {
        setAddErrorMessage(payload.ok ? '행 추가 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      setCurrentRecords((current) => [...current, payload.data.record]);
      setTemporaryNewRecordIds((current) => [payload.data.record.id, ...current]);
      setFilterField('rowIndex');
      setNewRecordForm(emptyNewRecordForm);
      setAddSuccessMessage('행이 추가되었습니다.');
    } catch {
      setAddErrorMessage('행 추가 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsAddingRecord(false);
    }
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
                    onChange={(event) => {
                      setFilterField(event.target.value as SheetFilterField);
                      setTemporaryNewRecordIds([]);
                    }}
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

              <label className={styles.selectGroup}>
                <span className={styles.filterLabel}>진행상황</span>
                <span className={styles.selectBox}>
                  <select
                    className={styles.select}
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as SheetStatusFilter)}
                  >
                    {sheetStatusFilterOptions.map((option) => (
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
              <button
                className={styles.addRowButton}
                type="button"
                onClick={() => {
                  setIsAddFormOpen((current) => !current);
                  setAddErrorMessage('');
                  setAddSuccessMessage('');
                }}
                aria-expanded={isAddFormOpen}
              >
                <Plus className={styles.addRowIcon} aria-hidden="true" />
                <span>행 추가</span>
              </button>
            </div>
          </header>

          {isAddFormOpen ? (
            <form className={styles.addRecordPanel} onSubmit={handleAddRecord}>
              <label className={styles.addRecordField}>
                <span>검색 날짜</span>
                <input
                  ref={addSearchDateRef}
                  type="date"
                  value={newRecordForm.searchDate}
                  onClick={openAddSearchDatePicker}
                  onFocus={openAddSearchDatePicker}
                  onChange={(event) => updateNewRecordField('searchDate', event.target.value)}
                />
              </label>
              <label className={styles.addRecordField}>
                <span>진행 상황</span>
                <select
                  value={newRecordForm.status}
                  onChange={(event) => updateNewRecordField('status', event.target.value as SheetRecordStatus)}
                >
                  {sheetStatusFilterOptions
                    .filter((option): option is { label: string; value: SheetRecordStatus } => option.value !== 'all')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </label>
              <label className={styles.addRecordField}>
                <span>침해 플랫폼</span>
                <input
                  value={newRecordForm.platform}
                  onChange={(event) => updateNewRecordField('platform', event.target.value)}
                  placeholder="플랫폼"
                  type="text"
                />
              </label>
              <label className={styles.addRecordField}>
                <span>침해 제품명</span>
                <input
                  required
                  value={newRecordForm.productName}
                  onChange={(event) => updateNewRecordField('productName', event.target.value)}
                  placeholder="제품명"
                  type="text"
                />
              </label>
              <label className={styles.addRecordField}>
                <span>침해 업체명칭</span>
                <input
                  value={newRecordForm.companyName}
                  onChange={(event) => updateNewRecordField('companyName', event.target.value)}
                  placeholder="업체명칭"
                  type="text"
                />
              </label>
              <label className={styles.addRecordField}>
                <span>판매가￥</span>
                <input
                  value={newRecordForm.price}
                  onChange={(event) => updateNewRecordField('price', formatIntegerInput(event.target.value))}
                  inputMode="numeric"
                  placeholder="판매가"
                  type="text"
                />
              </label>
              <label className={styles.addRecordField}>
                <span>판매수량</span>
                <input
                  value={newRecordForm.salesCount}
                  onChange={(event) => updateNewRecordField('salesCount', formatIntegerInput(event.target.value))}
                  inputMode="numeric"
                  type="text"
                />
              </label>
              <label className={styles.addRecordField}>
                <span>침해 제품사진 URL</span>
                <input
                  value={newRecordForm.imageUrl}
                  onChange={(event) => updateNewRecordField('imageUrl', event.target.value)}
                  placeholder="https://"
                  type="text"
                />
              </label>
              <label className={styles.addRecordField}>
                <span>판매링크</span>
                <input
                  value={newRecordForm.salesUrl}
                  onChange={(event) => updateNewRecordField('salesUrl', event.target.value)}
                  placeholder="https://"
                  type="text"
                />
              </label>
              <div className={styles.addRecordActions}>
                {addErrorMessage ? (
                  <p className={styles.inlineError} role="alert">
                    {addErrorMessage}
                  </p>
                ) : null}
                {addSuccessMessage ? <p className={styles.inlineSuccess}>{addSuccessMessage}</p> : null}
                <button
                  className={styles.closeAddRecordButton}
                  type="button"
                  onClick={() => {
                    setIsAddFormOpen(false);
                    setAddErrorMessage('');
                    setAddSuccessMessage('');
                  }}
                >
                  닫기
                </button>
                <button className={styles.addRecordSubmitButton} type="submit" disabled={isAddingRecord}>
                  {isAddingRecord ? (
                    <>
                      <DoubleBounceLoader size={18} variant="light" label="시트 행 추가 중" />
                      <span>추가 중</span>
                    </>
                  ) : (
                    '행 저장'
                  )}
                </button>
              </div>
            </form>
          ) : null}

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
              {visibleRecords.map((record) => (
                <div className={styles.tableRow} key={record.id}>
                  <span className={styles.indexCell}>
                    {temporaryNewRecordIds.includes(record.id) ? <span className={styles.newRecordChip}>NEW</span> : null}
                    <span>{String(record.rowIndex || '-').padStart(2, '0')}</span>
                  </span>
                  <span className={styles.statusCell} data-status={record.status}>
                    <i />
                    {record.status}
                  </span>
                  <span className={styles.dateCell}>{record.displayDate}</span>
                  <span className={styles.imageCell}>
                    {record.imageUrl ? (
                      <img
                        className={styles.productThumbnail}
                        src={record.imageUrl}
                        alt={`${record.productName} 제품`}
                        referrerPolicy="no-referrer"
                      />
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
                    <Link className={styles.tableLink} href={`/admin/sheets/${sheet.id}/records/${record.id}`}>
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
