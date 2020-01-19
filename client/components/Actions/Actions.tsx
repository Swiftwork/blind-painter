import React, { useContext } from 'react';

import { SessionContext } from 'context/store';

import s from './Actions.module.css';

import ClearIcon from 'assets/icons/clear.svg';
import UndoIcon from 'assets/icons/undo.svg';
import DoneIcon from 'assets/icons/done.svg';

export function Actions() {
  const { turnId, clientId, dispatch } = useContext(SessionContext);

  const onClear = () => {
    if (turnId !== clientId) return;
    dispatch({ type: 'UNDO', payload: {} });
  };

  const onUndo = () => {
    if (turnId !== clientId) return;
    dispatch({ type: 'UNDO', payload: { count: 1 } });
  };

  const onSubmit = () => {
    if (turnId !== clientId) return;
    dispatch({ type: 'TURN' });
  };

  return (
    <menu className={s.actions} aria-hidden={turnId !== clientId}>
      <ClearIcon className={s.icon} onClick={onClear} />
      <UndoIcon className={s.icon} onClick={onUndo} />
      <DoneIcon className={s.icon} onClick={onSubmit} />
    </menu>
  );
}
