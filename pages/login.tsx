import type { GetServerSideProps } from 'next';

import { LoginPage } from '@/components/auth/LoginPage';
import { getUserSessionUser } from '@/lib/auth/user';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const user = await getUserSessionUser(req, res);

  if (user) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default function UserLoginPage() {
  return (
    <LoginPage
      title="로그인 | LIFANG INC."
      loginEndpoint="/api/user/auth/login"
      titleId="user-login-title"
      emailInputId="user-email"
      passwordInputId="user-password"
    />
  );
}
