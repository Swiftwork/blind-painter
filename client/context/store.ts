import { createContext } from 'react';
import { Session, Client } from './interfaces';

export const defaultSession: Session = {
  code: '',
  stage: 'none',
  clientId: '',
  connected: false,
  rounds: 2,
  currentRound: 0,
  elapsed: 0,
  turnId: undefined,
  turnDuration: 1000 * 60,
  turnElapsed: 0,
  hostId: undefined,
  blindId: undefined,
  subject: undefined,
  clients: new Map<string, Client>(),
  dispatch: () => console.warn('context not initialized'),
};

export function fetchSession(): Partial<Session> {
  return JSON.parse(sessionStorage.getItem('session') as string, (key, value) => {
    if (key == 'clients') return new Map(value);
    return value;
  });
}

export function storeSession(session: Partial<Session>) {
  const cache = fetchSession();
  sessionStorage.setItem(
    'session',
    JSON.stringify({ ...cache, ...session }, (key, value) => {
      if (key == 'connected') return undefined;
      if (key == 'stage') return undefined;
      if (key == 'clients') return Array.from(value.entries());
      return value;
    }),
  );
}

export const initialSession = {
  ...defaultSession,
  ...fetchSession(),
};

export const SessionContext = createContext(defaultSession);
