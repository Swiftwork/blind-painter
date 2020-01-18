import { defaultSession } from './store';
import { Session, SessionAction, Point } from './interfaces';

export function reducer(state: Session, action: SessionAction): Session {
  let id, client, itteration: Point[][];

  switch (action.type) {
    case 'reset':
      return { ...state, ...defaultSession };

    case 'socket':
      return { ...state, connected: action.payload.status == 'connected' ? true : false };

    case 'session':
      const { clients, ...session } = action.payload.session;
      const newState = { ...state, ...session };
      if (!newState.clientId && action.payload.client.id) newState.clientId = action.payload.client.id;
      if (clients) newState.clients = new Map(clients);
      return newState;

    case 'start':
      return { ...state, stage: 'started', subject: action.payload.subject };

    case 'round':
      return { ...state, currentRound: action.payload.current };

    case 'turn':
      return { ...state, turnId: action.payload.clientId };

    case 'draw':
      id = action.payload.clientId;
      if (!id) id = state.clientId;
      if (!id) return state;

      client = state.clients.get(id);
      if (!client) return state;

      itteration = client.itterations[state.currentRound - 1];
      if (!itteration) client.itterations.push((itteration = []));

      if (Array.isArray(action.payload.points)) itteration.push(action.payload.points);
      else if (action.payload.points) itteration.push([action.payload.points]);

      return { ...state };

    case 'undo':
      id = action.payload.clientId;
      if (!id) id = state.clientId;
      if (!id) return state;

      client = state.clients.get(id);
      if (!client) return state;

      itteration = client.itterations[state.currentRound - 1];
      if (!itteration) return state;

      itteration.splice(-1 * action.payload.count, action.payload.count);
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
