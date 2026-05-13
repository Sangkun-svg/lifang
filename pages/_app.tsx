import type { AppProps } from 'next/app';

import { DesignFeedbackWidget } from '@/components/dev/DesignFeedbackWidget';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <DesignFeedbackWidget />
    </>
  );
}
