import React from 'react';

import s from './RangeSlider.module.css';

type Props = {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
};

export function RangeSlider({
  className,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onChange = () => {},
}: Props) {
  return (
    <input
      className={`${className || ''} ${s.rangeSlider}`}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      defaultValue={defaultValue}
      onChange={event => onChange(parseFloat(event.currentTarget.value))}
    />
  );
}
