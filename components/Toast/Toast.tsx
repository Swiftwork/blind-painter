import React, { ReactNode } from 'react';

import s from './Toast.module.css';

import ClearIcon from 'assets/icons/clear.svg';
type Props = {
  children: ReactNode;
  delay?: number;
  persistent?: boolean;
  onClear?: () => void;
};

export function Toast({ children, persistent = false, delay = 4600, onClear = () => {} }: Props) {
  if (!persistent) setTimeout(onClear, delay);
  return (
    <output className={s.toast}>
      {children}
      {persistent && <ClearIcon tabIndex={0} className={s.clear} onClick={onClear} />}
    </output>
  );
}
