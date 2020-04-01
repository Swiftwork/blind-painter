export interface Client {
  id: string;
  name: string;
  color: string;
  guess: string | undefined;
  nameTTS: string | undefined;
  connected: boolean;
  reaction: string;
  participant: boolean;
  iterations: number[][][];
}

export enum Reaction {
  Impressed,
  Confused,
  Angry,
}

export type Stage = 'none' | 'lobby' | 'started' | 'guessing' | 'reveal';

export interface SharedSession {
  code: string;
  stage: Stage;
  players: number;
  rounds: number;
  currentRound: number;
  elapsed: number;
  turnDuration: number;
  turnElapsed: number;
  turnOrder: string[];
  turnId: string | undefined;
  hostId: string | undefined;
  blindId: string | undefined;
  category: string | undefined;
  subject: string | undefined;
  clients: Map<string, Client>;
}

export interface ServerSession extends SharedSession {
  suspects: string[];
  guesses: string[];
}

export interface ClientSession extends SharedSession {
  clientId: string;
  connected: boolean;
  socket: boolean;
  blind: boolean;
  musicVolume: number;
  soundVolume: number;
}

// TODO: refactor
export type Session = ServerSession & ClientSession;

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
