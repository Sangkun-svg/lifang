import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Upload } from 'lucide-react';
import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/router';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { DoubleBounceLoader } from '@/components/ui/DoubleBounceLoader';
import type { ApiResponse } from '@/lib/api/responses';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser, type AdminSessionUser } from '@/lib/auth/admin';
import type { SheetSummary } from '@/types/sheet';

import styles from './index.module.css';

type AdminSheetsPageProps = {
  sheetSummaries: SheetSummary[];
  user: AdminSessionUser;
};

type UploadResponse = {
  redirectTo: string;
  sheet: SheetSummary;
};

export const getServerSideProps: GetServerSideProps<AdminSheetsPageProps> = async ({ req, res }) => {
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
        sheetSummaries: await getSheetSummaries(),
        user,
      },
    };
  } catch (error) {
    console.error('Load sheet summaries failed', error);

    return {
      props: {
        sheetSummaries: [],
        user,
      },
    };
  }
};

export default function AdminSheetsPage({ sheetSummaries }: AdminSheetsPageProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sheetName, setSheetName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file || isUploading) {
      return;
    }

    const formData = new FormData();
    formData.append('sheetName', sheetName.trim());
    formData.append('file', file);

    setErrorMessage('');
    setIsUploading(true);

    try {
      const response = await fetch('/api/admin/sheets/upload', {
        method: 'POST',
        body: formData,
      });
      const payload = (await response.json()) as ApiResponse<UploadResponse>;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? '업로드 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      await router.replace(payload.data.redirectTo);
    } catch {
      setErrorMessage('업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Head>
        <title>업로드 시트 | LIFANG INC.</title>
      </Head>

      <AdminLayout sheetSummaries={sheetSummaries}>
        <div className={styles.page}>
          <header className={styles.header}>
            <h1 className={styles.title}>업로드 시트</h1>
          </header>

          <form className={styles.uploadPanel} onSubmit={handleSubmit}>
            <label className={styles.field}>
              <span>시트명</span>
              <input
                value={sheetName}
                onChange={(event) => setSheetName(event.target.value)}
                placeholder="사이드바에 표시할 시트명을 입력해주세요."
                type="text"
              />
            </label>

            <label className={styles.field}>
              <span>엑셀 파일</span>
              <button
                className={styles.fileSelectButton}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={styles.fileSelectIcon} aria-hidden="true" />
                <span className={styles.fileName}>{file ? file.name : '파일 선택'}</span>
              </button>
              <input
                ref={fileInputRef}
                className={styles.fileInput}
                accept=".xlsx,.xls,.csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>

            {errorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button className={styles.uploadButton} type="submit" disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <DoubleBounceLoader size={18} variant="light" label="시트 업로드 중" />
                  <span>업로드 중</span>
                </>
              ) : (
                '시트 업로드'
              )}
            </button>
          </form>

          <section className={styles.sheetTable} aria-label="업로드된 시트">
            <div className={styles.tableHeader}>
              <span>시트명</span>
              <span>원본 파일</span>
              <span>데이터 수</span>
              <span>상세정보</span>
            </div>
            <div className={styles.tableRows}>
              {sheetSummaries.length > 0 ? (
                sheetSummaries.map((sheet) => (
                  <div className={styles.tableRow} key={sheet.id}>
                    <span>{sheet.name}</span>
                    <span>{sheet.originalFileName}</span>
                    <span>{sheet.recordCount.toLocaleString('ko-KR')}건</span>
                    <Link href={`/admin/sheets/${sheet.id}`}>보기</Link>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>업로드된 시트가 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </AdminLayout>
    </>
  );
}
