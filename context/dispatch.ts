import { Socket } from 'client/socket';
import { Dispatch } from 'react';
import { SessionAction } from 'shared/actions';

let socket: Socket | undefined;
let throttle = false;
const queuedPoints: number[] = [];

const sendPoints = (points: number[]) => {
  if (!socket || !points.length) return;
  socket.send({ type: 'C2S_DRAW', payload: { points } });
  points.length = 0;
};

export const attachSocketDispatch = (dispatch: Dispatch<SessionAction>) => (action: SessionAction) => {
  switch (action.type) {
    case 'S2C_SESSION': {
      if (!socket) {
        socket = new Socket(dispatch);
        window.addEventListener('beforeunload', () => {
          socket && socket.close(1000, 'Manually closed');
        });
      }
      if (!socket.connected) socket.open('/socket', action.payload.client.id);
      break;
    }

    case 'C2S_SETTINGS': {
      break;
    }

    case 'C2S_SESSION': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_START': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_DRAW_START': {
      queuedPoints.push(...action.payload.points);
      socket && socket.send(action);
      break;
    }

    case 'C2S_DRAW': {
      queuedPoints.push(...action.payload.points);
      if (!throttle) {
        throttle = true;
        setTimeout(() => {
          sendPoints(queuedPoints);
          throttle = false;
        }, 50);
      }
      break;
    }

    case 'C2S_KICK': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_UNDO': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_REACTION': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_TURN': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_GUESS': {
      socket && socket.send(action);
      break;
    }

    case 'C2S_END': {
      if (socket) {
        socket.send(action);
        socket.close(4000, 'Ending session');
      }
      break;
    }

    default: {
      if (action.type.startsWith('C2S')) throw new Error(`Unhandled action type: ${action.type}`);
      break;
    }
  }

  dispatch(action);
};
