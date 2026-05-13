import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { Footer } from '@/components/Footer';
import { MemberAccountForm } from '@/components/members/MemberAccountForm';
import { findAdminMember } from '@/lib/admin/members';
import { getSheetSummaries } from '@/lib/admin/sheets';
import { getAdminSessionUser } from '@/lib/auth/admin';
import type { Member } from '@/types/member';
import type { SheetSummary } from '@/types/sheet';

import styles from './new.module.css';

type MemberDetailPageProps = {
  member: Member;
  sheetSummaries: SheetSummary[];
};

export const getServerSideProps: GetServerSideProps<MemberDetailPageProps> = async ({ params, req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  const memberId = typeof params?.memberId === 'string' ? params.memberId : '';

  try {
    return {
      props: {
        member: findAdminMember(memberId),
        sheetSummaries: await getSheetSummaries(),
      },
    };
  } catch (error) {
    console.error('Load member detail sheet summaries failed', error);

    return {
      props: {
        member: findAdminMember(memberId),
        sheetSummaries: [],
      },
    };
  }
};

export default function MemberDetailPage({ member, sheetSummaries }: MemberDetailPageProps) {
  return (
    <>
      <Head>
        <title>회원정보상세 | LIFANG INC.</title>
      </Head>

      <div className={styles.page}>
        <MemberAccountForm mode="edit" member={member} sheetSummaries={sheetSummaries} />
        <Footer />
      </div>
    </>
  );
}
