import React, { createContext, ReactNode, useReducer } from 'react';
import { Util } from './util';

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
  clientId: string;
  connected: boolean;
  rounds: number;
  currentRound: number;
  time: number;
  currentTime: number;
  clients: Map<string, Client>;
}

export type SessionAction =
  | { type: 'reset' }
  | { type: 'socket'; payload: { status: 'connected' | 'disconnected' } }
  | { type: 'session'; payload: Partial<Session> }
  | { type: 'update'; payload: { id?: string; points: Point | Point[] } };

export interface SessionProps extends Session {
  dispatch: (action: SessionAction) => void;
}

const initialState: Session = Object.assign(
  {
    code: '',
    clientId: '',
    connected: false,
    rounds: 2,
    currentRound: 1,
    time: 1000 * 60,
    currentTime: 0,
    clients: new Map<string, Client>(),
  },
  JSON.parse(sessionStorage.getItem('session') as string, (key, value) => {
    if (key == 'clients') return new Map(value);
    return value;
  }),
);

export const SessionContext = createContext(initialState as SessionProps);

function reducer(state: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'reset':
      return initialState;

    case 'socket':
      return { ...state, connected: action.payload.status == 'connected' ? true : false };

    case 'session':
      const { clients, ...session } = action.payload;
      const newState = { ...state, ...session };
      if (clients) newState.clients = new Map(clients);
      return newState;

    case 'update':
      let id = action.payload.id;
      if (!id) id = state.clientId;
      if (!id) return state;

      const client: Client = state.clients.get(id) || {
        id: id,
        name: id,
        color: Util.intToRGB(Util.hashCode(id)),
        itterations: [],
      };

      let itteration = client.itterations[state.currentRound - 1];
      if (!itteration) client.itterations.push((itteration = []));

      if (Array.isArray(action.payload.points)) itteration = action.payload.points;
      else if (action.payload.points) itteration = [...itteration, action.payload.points];

      client.itterations[state.currentRound - 1] = itteration;

      return { ...state };

    default: {
      throw new Error(`Unhandled action type: ${(action as any).type}`);
    }
  }
}

export function SessionProvider(props: Readonly<{ children?: ReactNode }>) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = { ...state, dispatch };

  return <SessionContext.Provider value={value}>{props.children}</SessionContext.Provider>;
}

export const SessionConsumer = SessionContext.Consumer;
