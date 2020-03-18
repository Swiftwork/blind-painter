import sockjs, { Options, OpenEvent, MessageEvent, CloseEvent } from 'sockjs-client';
import { SessionAction, C2SAction, S2CAction } from 'shared/actions';

export interface SocketEvent {
  type: string;
  detail: any;
}

export class Socket {
  connected = false;

  socket: WebSocket | undefined;

  constructor(private dispatch: (action: SessionAction) => void) {}

  open(url: string, sessionId: string | undefined) {
    const options: Options = {};
    if (sessionId) options.sessionId = () => sessionId;
    this.socket = new sockjs(url, undefined, options);
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('close', this.onClose);
  }

  close(code = 1000, reason = 'Manually closed') {
    if (this.socket) this.socket.close(code, reason);
  }

  send(action: C2SAction) {
    if (this.socket) this.socket.send(JSON.stringify(action));
  }

  private onOpen = (_: OpenEvent) => {
    this.dispatch({ type: 'S2C_SOCKET', payload: { status: 'opened' } });
  };

  private onMessage = (event: MessageEvent) => {
    const action: S2CAction = JSON.parse(event.data);
    console.log(`Socket: ${action.type}`);
    if (action.type != 'S2C_ERROR') {
      this.dispatch(action);
    } else {
      console.warn(`[SOCKET | ${action.payload.code}]: ${action.payload.reason}`);
    }
  };

  private onClose = (event: CloseEvent) => {
    console.log(`[SOCKET | ${event.code}]: ${event.reason}`);
    if (this.socket) {
      this.socket.removeEventListener('open', this.onOpen);
      this.socket.removeEventListener('message', this.onMessage);
      this.socket.removeEventListener('close', this.onClose);
      this.socket = undefined;
    }
    this.dispatch({ type: 'S2C_SOCKET', payload: { status: 'closed' } });
    this.dispatch({ type: 'S2C_END' });
  };
}
