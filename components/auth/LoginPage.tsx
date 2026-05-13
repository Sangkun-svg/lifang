import Head from 'next/head';
import { useRouter } from 'next/router';
import { FormEvent, useMemo, useState } from 'react';

import { Footer } from '@/components/Footer';
import type { ApiResponse } from '@/lib/api/responses';

import styles from './LoginPage.module.css';

type LoginResponseData = {
  redirectTo: string;
  user: {
    id: string;
    email: string;
  };
};

type LoginPageProps = {
  title: string;
  loginEndpoint: string;
  heading?: string;
  titleId?: string;
  emailInputId?: string;
  passwordInputId?: string;
};

export function LoginPage({
  title,
  loginEndpoint,
  heading,
  titleId = 'login-title',
  emailInputId = 'login-email',
  passwordInputId = 'login-password',
}: LoginPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      const payload = (await response.json()) as ApiResponse<LoginResponseData>;

      if (!response.ok || !payload.ok) {
        setErrorMessage(payload.ok ? '로그인 처리 중 문제가 발생했습니다.' : payload.message);
        return;
      }

      await router.replace(payload.data.redirectTo);
    } catch {
      setErrorMessage('로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div className={styles.page}>
        <section
          className={styles.loginSection}
          aria-labelledby={heading ? titleId : undefined}
          aria-label={heading ? undefined : '로그인'}
        >
          <div className={styles.brandGroup}>
            <img className={styles.brandLogo} src="/assets/lifang-logo-main.svg" alt="LIFANG INC." />
            {heading ? (
              <h1 id={titleId} className={styles.title}>
                {heading}
              </h1>
            ) : null}
          </div>

          <form className={styles.form} onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor={emailInputId}>
                이메일
              </label>
              <input
                id={emailInputId}
                className={styles.input}
                type="text"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrorMessage('');
                }}
                placeholder="이메일을 입력해주세요."
                autoComplete="off"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor={passwordInputId}>
                비밀번호
              </label>
              <input
                id={passwordInputId}
                className={styles.input}
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrorMessage('');
                }}
                placeholder="비밀번호를 입력해주세요."
                autoComplete="new-password"
              />
            </div>

            {errorMessage ? (
              <p className={styles.errorMessage} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              className={styles.loginButton}
              data-active={canSubmit}
              type="submit"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? '로그인 중' : '로그인'}
            </button>
          </form>
        </section>

        <Footer />
      </div>
    </>
  );
}
