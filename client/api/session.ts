import { createContext } from 'react';

export interface Point {
  x: number;
  y: number;
}

export interface Client {
  name: string;
  color: string;
  first: Point[];
  second: Point[];
}

export function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function intToRGB(i: number) {
  const c = (i & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

export const session = {
  connected: false,
  clients: new Map<string, Client>(),

  updateClient(id: string | null, points: Point | Point[]) {
    if (!id) id = this.id;
    if (!id) return;

    const client: Client = this.clients.get(id) || {
      name: id,
      color: intToRGB(hashCode(id)),
      first: [],
      second: [],
    };

    if (Array.isArray(points)) client.first = points;
    else client.first.push(points);

    this.clients.set(id, client);
    return client.first;
  },

  get id(): string | null {
    return sessionStorage.getItem('sessionId');
  },

  set id(id: string | null) {
    if (!id) sessionStorage.removeItem('sessionId');
    else sessionStorage.setItem('sessionId', id);
  },
};

export const SessionContext = createContext(session);
