import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';

import { SessionProvider } from 'context/provider';

import 'styles/main.css';

function BlindApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>
      <SessionProvider>
        <Component {...pageProps} />
      </SessionProvider>
    </>
  );
}

export default BlindApp;
