import { LoginPage } from '@/components/auth/LoginPage';

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
