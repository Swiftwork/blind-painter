import { defaultSession } from './store';
import { SessionAction } from 'shared/actions';
import { Session } from 'shared/interfaces';

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
    case 'S2C_SOCKET': {
      return { ...state, socket: action.payload.status == 'opened' ? true : false };
    }

    case 'S2C_SESSION': {
      const { clients, ...session } = action.payload.session;
      const newState = { ...state, ...session };
      if (!newState.clientId && action.payload.client.id) newState.clientId = action.payload.client.id;
      if (clients) newState.clients = new Map(clients);
      return newState;
    }

    case 'S2C_CONNECTION': {
      const client = state.clients.get(action.payload.clientId);
      if (client) client.connected = action.payload.status == 'connected';
      return { ...state };
    }

    case 'S2C_START': {
      return {
        ...state,
        stage: 'started',
        category: action.payload.category,
        subject: action.payload.subject,
        turnOrder: action.payload.turnOrder,
        blind: action.payload.blind,
      };
    }

    case 'S2C_RESET': {
      const { clients, ...session } = action.payload.session;
      const newState = { ...state, ...session };
      if (clients) newState.clients = new Map(clients);
      return newState;
    }

    case 'C2S_KICK':
    case 'S2C_KICK': {
      const { clients } = state;
      clients.delete(action.payload.clientId);
      return { ...state, clients };
    }

    case 'S2C_ROUND': {
      return { ...state, currentRound: action.payload.current };
    }

    case 'S2C_TURN': {
      return { ...state, turnId: action.payload.clientId };
    }

    case 'C2S_DRAW_START':
    case 'S2C_DRAW_START': {
      const iteration = getIteration(action.payload.clientId, state);
      if (!iteration) return state;

      // Create a new segment
      if (Array.isArray(action.payload.points)) iteration.push(action.payload.points);
      else iteration.push([action.payload.points]);

      return { ...state };
    }

    case 'C2S_DRAW':
    case 'S2C_DRAW': {
      const iteration = getIteration(action.payload.clientId, state);
      if (!iteration) return state;
      const segment = iteration[iteration.length - 1];

      // Append to last segment
      if (Array.isArray(action.payload.points)) segment.push(...action.payload.points);
      else segment.push(action.payload.points);

      return { ...state };
    }

    case 'C2S_UNDO':
    case 'S2C_UNDO': {
      const iteration = getIteration(action.payload.clientId, state);
      if (!iteration) return state;

      // Remove count segments
      const count = action.payload.count || Infinity;
      iteration.splice(-1 * count, count);

      return { ...state };
    }

    case 'S2C_GUESS': {
      return { ...state, stage: 'guessing', turnId: undefined };
    }

    case 'S2C_REVEAL': {
      return {
        ...state,
        stage: 'reveal',
        category: action.payload.category,
        subject: action.payload.subject,
        blindId: action.payload.blindId,
        suspects: action.payload.suspects,
        guesses: action.payload.guesses,
      };
    }

    case 'S2C_END': {
      return { ...state, ...defaultSession };
    }

    default: {
      if (action.type.startsWith('S2C')) throw new Error(`Unhandled action type: ${action.type}`);
      return state;
    }
  }
}
