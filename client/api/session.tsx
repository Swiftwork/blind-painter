import React, { createContext, ReactNode, useReducer } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Client {
  id: string;
  name: string;
  color: string;
  itterations: Point[][];
}

export interface Session {
  code: string;
  status: 'none' | 'lobby' | 'started' | 'guessing' | 'ended';
  clientId: string;
  connected: boolean;
  rounds: number;
  currentRound: number;
  elapsed: number;
  turnId: string | undefined;
  turnDuration: number;
  turnElapsed: number;
  hostId: string | undefined;
  blindId: string | undefined;
  subject: string | undefined;
  clients: Map<string, Client>;
}

export type SessionAction =
  | { type: 'reset' }
  | { type: 'socket'; payload: { status: 'connected' | 'disconnected' } }
  | { type: 'session'; payload: { session: Partial<Session>; client: Partial<Client> } }
  | { type: 'start'; payload: { subject: string } }
  | { type: 'round'; payload: { current: number } }
  | { type: 'turn'; payload: { clientId: string } }
  | { type: 'draw'; payload: { clientId?: string; points: Point | Point[] } }
  | { type: 'guess' }
  | { type: 'end'; payload: { subject: string; blindId: string } };

export interface SessionProps extends Session {
  dispatch: (action: SessionAction) => void;
}

const initialState: Session = {
  code: '',
  status: 'none',
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
};

export const SessionContext = createContext(initialState as SessionProps);

function reducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'reset':
      return initialState;

    case 'socket':
      return { ...state, connected: action.payload.status == 'connected' ? true : false };

    case 'session':
      const { clients, ...session } = action.payload.session;
      const newState = { ...state, ...session };
      if (!newState.clientId && action.payload.client.id) newState.clientId = action.payload.client.id;
      if (clients) newState.clients = new Map(clients);
      return newState;

    case 'start':
      return { ...state, status: 'started', subject: action.payload.subject };

    case 'round':
      return { ...state, currentRound: action.payload.current };

    case 'turn':
      return { ...state, turnId: action.payload.clientId };

    case 'draw':
      let id = action.payload.clientId;
      if (!id) id = state.clientId;
      if (!id) return state;

      const client = state.clients.get(id);
      if (!client) return state;

      let itteration = client.itterations[state.currentRound - 1];
      if (!itteration) client.itterations.push((itteration = []));

      if (Array.isArray(action.payload.points)) itteration = action.payload.points;
      else if (action.payload.points) itteration = [...itteration, action.payload.points];

      client.itterations[state.currentRound - 1] = itteration;
      return { ...state };

    case 'guess':
      return { ...state };

    case 'end':
      return { ...state };

    default: {
      throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  }
}

export function SessionProvider(props: Readonly<{ children?: ReactNode }>) {
  const [state, dispatch] = useReducer(
    reducer,
    Object.assign(
      {},
      initialState,
      JSON.parse(sessionStorage.getItem('session') as string, (key, value) => {
        if (key == 'clients') return new Map(value);
        return value;
      }),
    ),
  );
  const value = { ...state, dispatch };

  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}

export const SessionConsumer = SessionContext.Consumer;
