import React from 'react';
import { AppProps } from 'next/app';

import { SessionProvider } from 'context/provider';

import 'styles/main.css';

function BlindApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default BlindApp;
