import React, { useContext } from 'react';

import { SessionContext } from 'context/store';

import s from './Actions.module.css';

import ClearIcon from 'assets/icons/clear.svg';
import UndoIcon from 'assets/icons/undo.svg';
import DoneIcon from 'assets/icons/done.svg';

interface Props {
  onClear?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSubmit?: () => void;
}

export function Actions({ onClear, onUndo, onRedo, onSubmit }: Props) {
  const { dispatch } = useContext(SessionContext);

  return (
    <menu className={s.actions}>
      <ClearIcon className={s.icon} onClick={() => onClear} />
      <UndoIcon className={s.icon} onClick={() => dispatch({ type: 'undo', payload: { count: 10 } })} />
      <DoneIcon className={s.icon} onClick={() => onSubmit} />
    </menu>
  );
}
