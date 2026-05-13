import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { Footer } from '@/components/Footer';
import { MemberAccountForm } from '@/components/members/MemberAccountForm';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { SheetSummary } from '@/types/sheet';

import styles from './new.module.css';

type NewMemberPageProps = {
  sheetSummaries: SheetSummary[];
};

export const getServerSideProps: GetServerSideProps<NewMemberPageProps> = async ({ req, res }) => {
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
      },
    };
  } catch (error) {
    console.error('Load member create sheet summaries failed', error);

    return {
      props: {
        sheetSummaries: [],
      },
    };
  }
};

export default function NewMemberPage({ sheetSummaries }: NewMemberPageProps) {
  return (
    <>
      <Head>
        <title>고객사 신규 계정생성 | LIFANG INC.</title>
      </Head>

      <div className={styles.page}>
        <MemberAccountForm mode="create" sheetSummaries={sheetSummaries} />
        <Footer />
      </div>
    </>
  );
}
