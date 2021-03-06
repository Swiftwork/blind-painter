import { createContext } from 'react';
import { Client, Session } from 'shared/interfaces';
import { SessionWithDispatch } from 'shared/actions';

export const defaultSession: SessionWithDispatch = {
  code: '',
  stage: 'none',
  clientId: '',
  connected: false,
  socket: false,
  musicVolume: 50,
  soundVolume: 50,
  players: 7,
  rounds: 2,
  currentRound: 0,
  elapsed: 0,
  turnDuration: 1000 * 60,
  turnElapsed: 0,
  turnOrder: [],
  turnId: undefined,
  hostId: undefined,
  blindId: undefined,
  category: undefined,
  subject: undefined,
  suspects: [],
  guesses: [],
  blind: false,
  clients: new Map<string, Client>(),
  dispatch: () => console.warn('context not initialized'),
};

export function fetchSession(): Partial<Session> {
  return typeof window !== 'undefined'
    ? JSON.parse(sessionStorage.getItem('session') as string, (key, value) => {
        if (key == 'clients') return new Map(value);
        return value;
      })
    : {};
}

export function storeSession(session: Partial<Session>) {
  if (typeof window === 'undefined') return;
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
