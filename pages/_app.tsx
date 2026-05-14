import type { AppProps } from 'next/app';

import { DesignFeedbackWidget } from '@/components/dev/DesignFeedbackWidget';
import { PageLoadingOverlay } from '@/components/ui/PageLoadingOverlay';

import 'air-datepicker/air-datepicker.css';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <PageLoadingOverlay />
      <DesignFeedbackWidget />
    </>
  );
}
