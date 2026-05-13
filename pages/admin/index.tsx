import type { GetServerSideProps } from 'next';

import { getAdminSessionUser } from '@/lib/auth/admin';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (!user) {
    return {
      redirect: {
        destination: '/admin/login',
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: '/admin/members',
      permanent: false,
    },
  };
};

export default function AdminHomePage() {
  return null;
}
