import type { GetServerSideProps } from 'next';

import { LoginPage } from '@/components/auth/LoginPage';
import { getAdminSessionUser } from '@/lib/auth/admin';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const user = await getAdminSessionUser(req, res);

  if (user) {
    return {
      redirect: {
        destination: '/admin',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default function AdminLoginPage() {
  return (
    <LoginPage
      title="관리자 로그인 | LIFANG INC."
      heading="관리자 로그인"
      loginEndpoint="/api/admin/auth/login"
      titleId="admin-login-title"
      emailInputId="admin-email"
      passwordInputId="admin-password"
    />
  );
}
