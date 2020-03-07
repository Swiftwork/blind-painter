import { defaultSession } from './store';
import { Session, SessionAction } from './interfaces';

export function reducer(state: Session, action: SessionAction): Session {
  const getIteration = (id: string | undefined, session: Session) => {
    if (!id) id = state.clientId;
    if (!id) return;

    const client = session.clients.get(id);
    if (!client) return;

    let iteration = client.iterations[session.currentRound - 1];
    if (!iteration) client.iterations.push((iteration = []));
    return iteration;
  };

  switch (action.type) {
    case 'RESET': {
      return { ...state, ...defaultSession };
    }

    case 'SOCKET': {
      return { ...state, connected: action.payload.status == 'connected' ? true : false };
    }

    case 'RECEIVE_SESSION': {
      const { clients, ...session } = action.payload.session;
      const newState = { ...state, ...session };
      if (!newState.clientId && action.payload.client.id) newState.clientId = action.payload.client.id;
      if (clients) newState.clients = new Map(clients);
      return newState;
    }

    case 'RECEIVE_CONNECTION': {
      const client = state.clients.get(action.payload.clientId);
      if (client) client.connected = action.payload.status == 'connected';
      return { ...state };
    }

    case 'RECEIVE_START': {
      return {
        ...state,
        stage: 'started',
        subject: action.payload.subject,
        turnOrder: action.payload.turnOrder,
        blind: action.payload.blind,
      };
    }

    case 'RECEIVE_ROUND': {
      return { ...state, currentRound: action.payload.current };
    }

    case 'RECEIVE_TURN': {
      return { ...state, turnId: action.payload.clientId };
    }

    case 'DRAW_START':
    case 'RECEIVE_DRAW_START': {
      const iteration = getIteration(action.payload.clientId, state);
      if (!iteration) return state;

      // Create a new segment
      if (Array.isArray(action.payload.points)) iteration.push(action.payload.points);
      else iteration.push([action.payload.points]);

      return { ...state };
    }

    case 'DRAW':
    case 'RECEIVE_DRAW': {
      const iteration = getIteration(action.payload.clientId, state);
      if (!iteration) return state;
      const segment = iteration[iteration.length - 1];

      // Append to last segment
      if (Array.isArray(action.payload.points)) segment.push(...action.payload.points);
      else segment.push(action.payload.points);

      return { ...state };
    }

    case 'UNDO':
    case 'RECEIVE_UNDO': {
      const iteration = getIteration(action.payload.clientId, state);
      if (!iteration) return state;

      // Remove count segments
      const count = action.payload.count || Infinity;
      iteration.splice(-1 * count, count);

      return { ...state };
    }

    case 'RECEIVE_GUESS': {
      return { ...state, stage: 'guessing', turnId: undefined };
    }

    case 'RECEIVE_END': {
      return {
        ...state,
        stage: 'ended',
        subject: action.payload.subject,
        blindId: action.payload.blindId,
        suspects: action.payload.suspects,
        guesses: action.payload.guesses,
      };
    }

    default: {
      if (action.type.startsWith('RECEIVE')) throw new Error(`Unhandled action type: ${action.type}`);
      return state;
    }
  }
}
