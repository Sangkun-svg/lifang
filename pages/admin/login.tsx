import { LoginPage } from '@/components/auth/LoginPage';

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
