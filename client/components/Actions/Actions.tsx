import React from 'react';

import s from './Actions.module.css';

import ClearIcon from 'assets/icons/clear.svg';
import UndoIcon from 'assets/icons/undo.svg';
import RedoIcon from 'assets/icons/redo.svg';
import DoneIcon from 'assets/icons/done.svg';

interface Props {
  onClear?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSubmit?: () => void;
}

export function Actions({ onClear, onUndo, onRedo, onSubmit }: Props) {
  return (
    <menu className={s.actions}>
      <ClearIcon className={s.icon} onClick={() => onClear} />
      <UndoIcon className={s.icon} onClick={() => onUndo} />
      <RedoIcon className={s.icon} onClick={() => onRedo} />
      <DoneIcon className={s.icon} onClick={() => onSubmit} />
    </menu>
  );
}
