export interface Point {
  x: number;
  y: number;
}

export interface Client {
  id: string;
  name: string;
  color: string;
  connected: boolean;
  participant: boolean;
  iterations: Point[][][];
}

export type Stage = 'none' | 'lobby' | 'started' | 'guessing' | 'ended';

export interface Session {
  code: string;
  stage: Stage;
  clientId: string;
  connected: boolean;
  socket: boolean;
  rounds: number;
  currentRound: number;
  elapsed: number;
  turnDuration: number;
  turnElapsed: number;
  turnOrder: string[];
  turnId: string | undefined;
  hostId: string | undefined;
  blindId: string | undefined;
  subject: string | undefined;
  suspects: string[];
  guesses: string[];
  blind: boolean;
  clients: Map<string, Client>;
}

export interface Category {
  id: string;
  name: string;
}

export function isCategory(category: any): category is Category {
  return 'id' in category;
}

export interface Group {
  name: string;
  categories: (Category | Group)[];
}

export function isGroup(group: any): group is Group {
  return 'categories' in group;
}
