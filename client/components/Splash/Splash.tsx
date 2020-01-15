import React from 'react';

import s from './Splash.module.css';

import SplashImage from 'assets/splash.full.svg';

export function Splash() {
  return <SplashImage className={s.splash} />;
}
