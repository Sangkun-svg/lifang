import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CalendarIcon, PlusIcon, SearchIcon } from '@/components/icons/AdminIcons';
import { adminMembers } from '@/lib/admin/members';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { Member } from '@/types/member';
import type { SheetSummary } from '@/types/sheet';

import styles from './index.module.css';

type AdminMembersPageProps = {
  members: Member[];
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

type DateFilterButtonProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function formatDateLabel(value: string) {
  if (!value) {
    return '';
  }

  const [year, month, day] = value.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${year.slice(2)}. ${month}. ${day}`;
}

function DateFilterButton({ label, value, onChange }: DateFilterButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();

    try {
      input.showPicker();
    } catch {
      input.click();
    }
  };

  return (
    <span className={styles.datePicker}>
      <button className={styles.dateBox} type="button" onClick={openDatePicker} aria-label={label}>
        <span>{formatDateLabel(value)}</span>
        <CalendarIcon className={styles.dateIcon} />
      </button>
      <input
        ref={inputRef}
        className={styles.nativeDateInput}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        tabIndex={-1}
      />
    </span>
  );
}

export const getServerSideProps: GetServerSideProps<AdminMembersPageProps> = async ({ req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  try {
    return {
      props: {
        members: adminMembers,
        sheetSummaries: await getSheetSummaries(),
        user,
      },
    };
  } catch (error) {
    console.error('Load member page sheet summaries failed', error);

    return {
      props: {
        members: adminMembers,
        sheetSummaries: [],
        user,
      },
    };
  }
};

export default function AdminMembersPage({ members, sheetSummaries }: AdminMembersPageProps) {
  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('2026-04-02');
  const [endDate, setEndDate] = useState('2026-04-02');

  const visibleMembers = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return members.filter((member) => {
      const isAfterStart = startDate ? member.createdAtDate >= startDate : true;
      const isBeforeEnd = endDate ? member.createdAtDate <= endDate : true;
      const matchesCompany = normalizedKeyword ? member.companyName.toLowerCase().includes(normalizedKeyword) : true;

      return isAfterStart && isBeforeEnd && matchesCompany;
    });
  }, [endDate, keyword, members, startDate]);

  return (
    <>
      <Head>
        <title>회원목록 | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.header}>
          <h1 className={styles.title}>회원목록</h1>

          <div className={styles.filters}>
            <div className={styles.dateFilter} aria-label="검색 날짜">
              <span className={styles.filterLabel}>검색 날짜</span>
              <DateFilterButton label="검색 시작 날짜" value={startDate} onChange={setStartDate} />
              <span className={styles.tilde}>~</span>
              <DateFilterButton label="검색 종료 날짜" value={endDate} onChange={setEndDate} />
            </div>

            <label className={styles.searchGroup}>
              <span className={styles.filterLabel}>업체명</span>
              <span className={styles.searchBox}>
                <input
                  className={styles.searchInput}
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="업체명으로 검색해주세요."
                  type="search"
                />
                <SearchIcon className={styles.searchIcon} />
              </span>
            </label>

            <Link className={styles.createButton} href="/admin/members/new">
              신규 계정 생성하기 <PlusIcon className={styles.plusIcon} />
            </Link>
          </div>
        </div>

        <section className={styles.tableCard} aria-label="회원 목록 테이블">
          <div className={styles.tableHeader}>
            <span className={styles.dateCell}>가입 일자</span>
            <span className={styles.companyCell}>업체명</span>
            <span className={styles.managerCell}>담당자</span>
            <span className={styles.emailCell}>이메일</span>
            <span className={styles.sheetCell}>연결 시트</span>
            <span className={styles.actionCell}>상세정보</span>
          </div>

          <div className={styles.rows}>
            {visibleMembers.map((member) => (
              <div className={styles.tableRow} key={member.id}>
                <span className={styles.dateCell}>{member.createdAt}</span>
                <span className={styles.companyCell}>{member.companyName}</span>
                <span className={styles.managerCell}>{member.managerName}</span>
                <span className={styles.emailCell}>{member.email}</span>
                <span className={styles.sheetCell}>
                  <span className={styles.sheetUrl}>{member.sheetLinks[0]}</span>
                  <span className={styles.sheetCount}>외{member.sheetLinks.length}</span>
                </span>
                <Link className={styles.actionCell} href={`/admin/members/${member.id}`}>
                  보기
                </Link>
              </div>
            ))}
          </div>
        </section>
      </AdminLayout>
    </>
  );
}
