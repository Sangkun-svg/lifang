import type { GetServerSideProps } from 'next';
import Head from 'next/head';

import { Footer } from '@/components/Footer';
import { MemberAccountForm } from '@/components/members/MemberAccountForm';
import { getAdminMemberById } from '@/lib/admin/members';
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
    const [member, sheetSummaries] = await Promise.all([getAdminMemberById(memberId), getSheetSummaries()]);

    if (!member) {
      return {
        redirect: {
          destination: '/admin/members',
          permanent: false,
        },
      };
    }

    return {
      props: {
        member,
        sheetSummaries,
      },
    };
  } catch (error) {
    console.error('Load member detail failed', error);

    return {
      redirect: {
        destination: '/admin/members',
        permanent: false,
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
