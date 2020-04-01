import React, { useContext } from 'react';

import { SessionContext } from 'context/store';
import { Reaction } from 'shared/interfaces';

import s from './Actions.module.css';

import ImpressedIcon from 'assets/icons/impressed.svg';
import ConfusedIcon from 'assets/icons/confused.svg';
import AngryIcon from 'assets/icons/angry.svg';
import ClearIcon from 'assets/icons/clear.svg';
import UndoIcon from 'assets/icons/undo.svg';
import DoneIcon from 'assets/icons/done.svg';

export function Actions() {
  const { turnId, clientId, dispatch } = useContext(SessionContext);

  const onReact = (reaction: Reaction) => {
    dispatch({ type: 'C2S_REACTION', payload: { reaction } });
  };

  const onClear = () => {
    if (turnId !== clientId) return;
    dispatch({ type: 'C2S_UNDO', payload: {} });
  };

  const onUndo = () => {
    if (turnId !== clientId) return;
    dispatch({ type: 'C2S_UNDO', payload: { count: 1 } });
  };

  const onSubmit = () => {
    if (turnId !== clientId) return;
    dispatch({ type: 'C2S_TURN' });
  };

  return (
    <menu className={s.actions}>
      {turnId !== clientId ? (
        <>
          <ImpressedIcon className={s.icon} onClick={() => onReact(Reaction.Impressed)} />
          <ConfusedIcon className={s.icon} onClick={() => onReact(Reaction.Confused)} />
          <AngryIcon className={s.icon} onClick={() => onReact(Reaction.Angry)} />
        </>
      ) : (
        <>
          <ClearIcon className={s.icon} onClick={onClear} />
          <UndoIcon className={s.icon} onClick={onUndo} />
          <DoneIcon className={s.icon} onClick={onSubmit} />
        </>
      )}
    </menu>
  );
}
