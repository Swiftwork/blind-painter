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

export function Controls({ onClear, onUndo, onRedo, onSubmit }: Props) {
  return (
    <menu className={s.actions}>
      <ClearIcon onClick={() => onClear} />
      <UndoIcon onClick={() => onUndo} />
      <RedoIcon onClick={() => onRedo} />
      <DoneIcon onClick={() => onSubmit} />
    </menu>
  );
}
