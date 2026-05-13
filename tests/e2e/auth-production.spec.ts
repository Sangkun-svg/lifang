import { expect, test, type Page } from '@playwright/test';

type Credentials = {
  email: string;
  password: string;
};

function getCredentials(prefix: 'ADMIN' | 'USER'): Credentials | null {
  const email = process.env[`LIFANG_E2E_${prefix}_EMAIL`];
  const password = process.env[`LIFANG_E2E_${prefix}_PASSWORD`];

  if (!email || !password) {
    return null;
  }

  return { email, password };
}

async function login(page: Page, path: '/admin/login' | '/login', credentials: Credentials) {
  await page.goto(path);
  await page.getByLabel('이메일').fill(credentials.email);
  await page.getByLabel('비밀번호').fill(credentials.password);
  await page.getByRole('button', { name: '로그인' }).click();
}

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe('production auth and access control', () => {
  test('unauthenticated visitors are redirected away from protected pages', async ({ page }) => {
    await page.goto('/admin/members');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();

    await page.goto('/admin/requests');
    await expect(page).toHaveURL(/\/admin\/login$/);

    await page.goto('/admin/sheets');
    await expect(page).toHaveURL(/\/admin\/login$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('이메일')).toBeVisible();

    await page.goto('/products/%EA%B3%B5%EB%A3%A1');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('production validation rejects malformed login requests', async ({ request }) => {
    const adminResponse = await request.post('/api/admin/auth/login', {
      data: { email: 'not-an-email', password: '' },
    });
    const userResponse = await request.post('/api/user/auth/login', {
      data: { email: 'not-an-email', password: '' },
    });

    expect(adminResponse.status()).toBe(400);
    expect(userResponse.status()).toBe(400);

    await expect(adminResponse.json()).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_INPUT',
    });
    await expect(userResponse.json()).resolves.toMatchObject({
      ok: false,
      code: 'INVALID_INPUT',
    });
  });

  test('local design feedback tools are hidden in production runtime', async ({ page, request }) => {
    await page.goto('/admin/login');

    await expect(page.getByRole('button', { name: '디자인 피드백' })).toHaveCount(0);

    const response = await request.post('/api/dev/design-feedback', {
      data: {
        comment: 'production hidden check',
        element: {
          height: 1,
          selector: 'body',
          tagName: 'body',
          text: '',
          width: 1,
          x: 0,
          y: 0,
        },
        path: '/admin/login',
        url: 'http://localhost/admin/login',
      },
    });

    expect(response.status()).toBe(404);
  });

  test('admin credentials cannot sign in through the user login API', async ({ request }) => {
    const admin = getCredentials('ADMIN');
    test.skip(!admin, 'Set LIFANG_E2E_ADMIN_EMAIL and LIFANG_E2E_ADMIN_PASSWORD to run this check.');
    if (!admin) {
      return;
    }

    const response = await request.post('/api/user/auth/login', {
      data: admin,
    });

    expect(response.status()).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: 'USER_FORBIDDEN',
    });
  });

  test('user credentials cannot sign in through the admin login API', async ({ request }) => {
    const user = getCredentials('USER');
    test.skip(!user, 'Set LIFANG_E2E_USER_EMAIL and LIFANG_E2E_USER_PASSWORD to run this check.');
    if (!user) {
      return;
    }

    const response = await request.post('/api/admin/auth/login', {
      data: user,
    });

    expect(response.status()).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      code: 'ADMIN_FORBIDDEN',
    });
  });

  test('an authenticated admin cannot enter the user dashboard', async ({ page }) => {
    const admin = getCredentials('ADMIN');
    test.skip(!admin, 'Set LIFANG_E2E_ADMIN_EMAIL and LIFANG_E2E_ADMIN_PASSWORD to run this check.');
    if (!admin) {
      return;
    }

    await login(page, '/admin/login', admin);
    await expect(page).toHaveURL(/\/admin\/members$/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByLabel('이메일')).toBeVisible();
  });

  test('an authenticated user cannot enter admin pages', async ({ page }) => {
    const user = getCredentials('USER');
    test.skip(!user, 'Set LIFANG_E2E_USER_EMAIL and LIFANG_E2E_USER_PASSWORD to run this check.');
    if (!user) {
      return;
    }

    await login(page, '/login', user);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto('/admin/members');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: '관리자 로그인' })).toBeVisible();
  });
});

test.describe('production desktop layout', () => {
  test('login pages do not create document-level horizontal overflow', async ({ page }) => {
    await page.goto('/admin/login');
    await expectNoDocumentHorizontalOverflow(page);

    await page.goto('/login');
    await expectNoDocumentHorizontalOverflow(page);
  });

  test('protected admin and user pages fit the document while tables can scroll internally', async ({ page }) => {
    const admin = getCredentials('ADMIN');
    const user = getCredentials('USER');
    test.skip(!admin || !user, 'Set both admin and user LIFANG_E2E credentials to run protected layout checks.');
    if (!admin || !user) {
      return;
    }

    await login(page, '/admin/login', admin);
    await expect(page).toHaveURL(/\/admin\/members$/);

    for (const path of ['/admin/members', '/admin/requests', '/admin/sheets']) {
      await page.goto(path);
      await expectNoDocumentHorizontalOverflow(page);
    }

    await login(page, '/login', user);
    await expect(page).toHaveURL(/\/dashboard$/);

    for (const path of ['/dashboard', '/products/%EA%B3%B5%EB%A3%A1']) {
      await page.goto(path);
      await expectNoDocumentHorizontalOverflow(page);
    }
  });
});
