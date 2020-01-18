export type SendAction =
  | { type: 'RESET' }
  | { type: 'SOCKET'; payload: { status: 'connected' | 'disconnected' } }
  | { type: 'START' }
  | { type: 'TURN' }
  | { type: 'DRAW_START'; payload: { clientId?: string; points: Point | Point[] } }
  | { type: 'DRAW'; payload: { clientId?: string; points: Point | Point[] } }
  | { type: 'UNDO'; payload: { clientId?: string; count?: number } }
  | { type: 'GUESS'; payload: { guess: string } }
  | { type: 'END' };

export type ReceiveAction =
  | { type: 'RECEIVE_SESSION'; payload: { session: Partial<Session>; client: Partial<Client> } }
  | { type: 'RECEIVE_CONNECTION'; payload: { clientId: string; status: 'connected' | 'disconnected' } }
  | { type: 'RECEIVE_START'; payload: { subject: string; blind: boolean } }
  | { type: 'RECEIVE_ROUND'; payload: { current: number } }
  | { type: 'RECEIVE_TURN'; payload: { clientId: string } }
  | { type: 'RECEIVE_DRAW_START'; payload: { clientId: string; points: Point | Point[] } }
  | { type: 'RECEIVE_DRAW'; payload: { clientId: string; points: Point | Point[] } }
  | { type: 'RECEIVE_UNDO'; payload: { clientId: string; count?: number } }
  | { type: 'RECEIVE_GUESS' }
  | { type: 'RECEIVE_END'; payload: { subject: string; blindId: string; suspects: string[]; guesses: string[] } };

export type SessionAction = SendAction | ReceiveAction;

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
  turnDuration: number;
  turnElapsed: number;
  turnId: string | undefined;
  hostId: string | undefined;
  blindId: string | undefined;
  subject: string | undefined;
  suspects: string[];
  guesses: string[];
  blind: boolean;
  clients: Map<string, Client>;
  dispatch: (action: SessionAction) => void;
}
