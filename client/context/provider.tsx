import React, { useReducer, ReactNode } from 'react';

import { SessionContext, initialSession } from './store';
import { reducer } from './reducer';

export function SessionProvider(props: Readonly<{ children?: ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, initialSession);
  const value = { ...state, dispatch };
  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}
