import React from 'react';

import s from './SelectRange.module.css';

type Props = {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
};

export function SelectRange({
  className,
  min = 0,
  max = 10,
  step = 1,
  value,
  defaultValue,
  onChange = () => {},
}: Props) {
  const range = Math.floor((max - min) / step + 1);
  return (
    <div className={`${className || ''} ${s.selectRange}`}>
      {Array.from(Array(range), (_, i) => (
        <span
          className={s.value}
          key={i}
          tabIndex={0}
          aria-selected={i * step + min == (value || defaultValue)}
          onClick={() => onChange(i * step + min)}>
          {i * step + min}
        </span>
      ))}
    </div>
  );
}
