import { Socket } from 'api/socket';
import { SessionAction, Point } from './interfaces';
import { Dispatch } from 'react';

let socket: Socket | undefined;
let throttle = false;
const queuedPoints: Point[] = [];

const sendPoints = (points: Point[]) => {
  if (!socket || !points.length) return;
  socket.send('DRAW', { points });
  points.length = 0;
};

export const attachSocketDispatch = (dispatch: Dispatch<SessionAction>) => (action: SessionAction) => {
  switch (action.type) {
    case 'RECEIVE_SESSION': {
      if (socket) return;
      socket = new Socket(dispatch);
      socket.open('/socket', action.payload.client.id);
      break;
    }

    case 'START': {
      socket && socket.send(action.type);
      break;
    }

    case 'DRAW_START': {
      const points = action.payload.points;
      Array.isArray(points) ? queuedPoints.push(...points) : queuedPoints.push(points);
      socket && socket.send(action.type, action.payload);
      break;
    }

    case 'DRAW': {
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

    case 'UNDO': {
      socket && socket.send(action.type, action.payload);
      break;
    }

    case 'TURN': {
      socket && socket.send(action.type);
      break;
    }

    case 'GUESS': {
      socket && socket.send(action.type, action.payload);
      break;
    }

    default: {
      if (!action.type.startsWith('RECEIVE')) throw new Error(`Unhandled action type: ${action.type}`);
      break;
    }
  }

  dispatch(action);
};
