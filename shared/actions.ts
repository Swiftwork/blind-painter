import { Point, Client, Session, Reaction } from './interfaces';

/* CLIENT TO SERVER ACTIONS */

export type C2SSessionPayload = { players?: number; rounds?: number; turnDuration?: number };
export type C2SSettingsPayload = { musicVolume?: number; soundVolume?: number };
export type C2SStartPayload = { categoryId: string };
export type C2SKickPayload = { clientId: string };
export type C2SDrawStartPayload = { clientId?: string; points: Point | Point[] };
export type C2SReactionPayload = { clientId?: string; reaction: Reaction };
export type C2SDrawPayload = { clientId?: string; points: Point | Point[] };
export type C2SUndoPayload = { clientId?: string; count?: number };
export type C2SGuessPayload = { guess: string };

export type C2SAction =
  | { type: 'C2S_SESSION'; payload: C2SSessionPayload }
  | { type: 'C2S_SETTINGS'; payload: C2SSettingsPayload }
  | { type: 'C2S_START'; payload: C2SStartPayload }
  | { type: 'C2S_KICK'; payload: C2SKickPayload }
  | { type: 'C2S_TURN' }
  | { type: 'C2S_DRAW_START'; payload: C2SDrawStartPayload }
  | { type: 'C2S_DRAW'; payload: C2SDrawPayload }
  | { type: 'C2S_REACTION'; payload: C2SReactionPayload }
  | { type: 'C2S_UNDO'; payload: C2SUndoPayload }
  | { type: 'C2S_GUESS'; payload: C2SGuessPayload }
  | { type: 'C2S_RESET' }
  | { type: 'C2S_END' };

/* SERVER TO CLIENT ACTIONS */

export type S2CSocketPayload = { status: 'opened' | 'closed' };
export type S2CSessionPayload = { session: Partial<Session>; client: Partial<Client> };
export type S2CConnectionPayload = { clientId: string; status: 'connected' | 'disconnected' };
export type S2CStartPayload = { category: string; subject: string; turnOrder: string[]; blind: boolean };
export type S2CResetPayload = { session: Partial<Session> };
export type S2CKickPayload = { clientId: string };
export type S2CRoundPayload = { current: number };
export type S2CTurnPayload = { clientId: string };
export type S2CDrawStartPayload = { clientId: string; points: Point | Point[] };
export type S2CDrawPayload = { clientId: string; points: Point | Point[] };
export type S2CUndoPayload = { clientId: string; count?: number };
export type S2CReactionPayload = { clientId: string; reaction: string };
export type S2CRevealPayload = {
  category: string;
  subject: string;
  blindId: string;
  suspects: string[];
  guesses: string[];
};
export type S2CErrorPayload = { code: number; reason: string };

export type S2CAction =
  | { type: 'S2C_SOCKET'; payload: S2CSocketPayload }
  | { type: 'S2C_SESSION'; payload: S2CSessionPayload }
  | { type: 'S2C_CONNECTION'; payload: S2CConnectionPayload }
  | { type: 'S2C_START'; payload: S2CStartPayload }
  | { type: 'S2C_RESET'; payload: S2CResetPayload }
  | { type: 'S2C_KICK'; payload: S2CKickPayload }
  | { type: 'S2C_ROUND'; payload: S2CRoundPayload }
  | { type: 'S2C_TURN'; payload: S2CTurnPayload }
  | { type: 'S2C_DRAW_START'; payload: S2CDrawStartPayload }
  | { type: 'S2C_DRAW'; payload: S2CDrawPayload }
  | { type: 'S2C_UNDO'; payload: S2CUndoPayload }
  | { type: 'S2C_REACTION'; payload: S2CReactionPayload }
  | { type: 'S2C_GUESS' }
  | { type: 'S2C_REVEAL'; payload: S2CRevealPayload }
  | { type: 'S2C_END' }
  | { type: 'S2C_ERROR'; payload: S2CErrorPayload };

export type SocketPayload = { socketSession: string };

export type SessionAction = C2SAction | S2CAction;

export type SocketAction = C2SAction & { payload: SocketPayload };

export interface SessionWithDispatch extends Session {
  dispatch: (action: SessionAction) => void;
}
