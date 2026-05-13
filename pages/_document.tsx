import { Html, Head, Main, NextScript } from 'next/document';

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL;

  if (!siteUrl) {
    return null;
  }

  const normalizedUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
  return normalizedUrl.replace(/\/$/, '');
}

export default function Document() {
  const siteUrl = getSiteUrl();
  const faviconHref = siteUrl ? `${siteUrl}/favicon.svg` : '/favicon.svg';

  return (
    <Html lang="ko">
      <Head>
        <link rel="shortcut icon" href={faviconHref} />
        <link rel="icon" href={faviconHref} type="image/svg+xml" />
        <meta name="theme-color" content="#B2081D" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
