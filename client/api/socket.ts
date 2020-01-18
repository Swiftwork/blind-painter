import sockjs, { Options, OpenEvent, MessageEvent, CloseEvent } from 'sockjs-client';
import { SessionAction } from 'context/interfaces';

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

  close() {
    if (this.socket) this.socket.close();
  }

  send(type: string, detail?: any) {
    if (this.socket) this.socket.send(JSON.stringify({ type, detail }));
  }

  private onOpen = (event: OpenEvent) => {
    this.dispatch({ type: 'SOCKET', payload: { status: 'connected' } });
  };

  private onMessage = (event: MessageEvent) => {
    const { type, detail }: SocketEvent = JSON.parse(event.data);
    console.log(`Socket: ${type}`);
    if (type != 'error') {
      this.dispatch({ type: `RECEIVE_${type}`, payload: detail } as SessionAction);
    } else {
      console.warn(`[SOCKET | ${detail.code}]: ${detail.reason}`);
    }
  };

  private onClose = (event: CloseEvent) => {
    console.warn(`[SOCKET | ${event.code}]: ${event.reason}`);
    if (this.socket) {
      this.socket.removeEventListener('open', this.onOpen);
      this.socket.removeEventListener('message', this.onMessage);
      this.socket.removeEventListener('close', this.onClose);
      this.socket = undefined;
    }
    this.dispatch({ type: 'SOCKET', payload: { status: 'disconnected' } });
    this.dispatch({ type: 'RESET' });
  };
}
