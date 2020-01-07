import React from 'react';

import SplashImage from './assets/splash.full.svg';

export function Splash() {
  return (
    <SplashImage
      style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        maxHeight: '75%',
        pointerEvents: 'none',
      }}
    />
  );
}
