export type SessionAction =
  | { type: 'reset' }
  | { type: 'socket'; payload: { status: 'connected' | 'disconnected' } }
  | { type: 'session'; payload: { session: Partial<Session>; client: Partial<Client> } }
  | { type: 'start'; payload: { subject: string } }
  | { type: 'round'; payload: { current: number } }
  | { type: 'turn'; payload: { clientId: string } }
  | { type: 'draw'; payload: { clientId?: string; points: Point | Point[] } }
  | { type: 'undo'; payload: { clientId?: string; count: number } }
  | { type: 'guess' }
  | { type: 'end'; payload: { subject: string; blindId: string } };

export interface Point {
  x: number;
  y: number;
}

export interface Client {
  id: string;
  name: string;
  color: string;
  connected: boolean;
  participate: boolean;
  itterations: Point[][][];
}

export type Stage = 'none' | 'lobby' | 'started' | 'guessing' | 'ended';

export interface Session {
  code: string;
  stage: Stage;
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
  dispatch: (action: SessionAction) => void;
}
