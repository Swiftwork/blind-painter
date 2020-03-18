import { Socket } from 'client/socket';
import { Dispatch } from 'react';
import { Point } from 'shared/interfaces';
import { SessionAction } from 'shared/actions';

let socket: Socket | undefined;
let throttle = false;
const queuedPoints: Point[] = [];

const sendPoints = (points: Point[]) => {
  if (!socket || !points.length) return;
  socket.send('C2S_DRAW', { points });
  points.length = 0;
};

export const attachSocketDispatch = (dispatch: Dispatch<SessionAction>) => (action: SessionAction) => {
  switch (action.type) {
    case 'S2C_SESSION': {
      if (socket) return;
      socket = new Socket(dispatch);
      socket.open('/socket', action.payload.client.id);
      break;
    }

    case 'C2S_START': {
      socket && socket.send(action.type, action.payload);
      break;
    }

    case 'C2S_DRAW_START': {
      const points = action.payload.points;
      Array.isArray(points) ? queuedPoints.push(...points) : queuedPoints.push(points);
      socket && socket.send(action.type, action.payload);
      break;
    }

    case 'C2S_DRAW': {
      const points = action.payload.points;
      Array.isArray(points) ? queuedPoints.push(...points) : queuedPoints.push(points);
      if (!throttle) {
        sendPoints(queuedPoints);
        throttle = true;
        setTimeout(() => {
          sendPoints(queuedPoints);
          throttle = false;
        }, 50);
      }
      break;
    }

    case 'C2S_KICK': {
      socket && socket.send(action.type, action.payload);
      break;
    }

    case 'C2S_UNDO': {
      socket && socket.send(action.type, action.payload);
      break;
    }

    case 'C2S_TURN': {
      socket && socket.send(action.type);
      break;
    }

    case 'C2S_GUESS': {
      socket && socket.send(action.type, action.payload);
      break;
    }

    default: {
      if (action.type.startsWith('C2S')) throw new Error(`Unhandled action type: ${action.type}`);
      break;
    }
  }

  dispatch(action);
};
