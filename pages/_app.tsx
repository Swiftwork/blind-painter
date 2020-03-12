import React from 'react';
import App from 'next/app';
import { SessionProvider } from '../context/provider';

import '../styles/main.css';

class BlindApp extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <SessionProvider>
        <Component {...pageProps} />
      </SessionProvider>
    );
  }
}

export default BlindApp;
