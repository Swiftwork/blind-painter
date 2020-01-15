import sockjs, { Options, OpenEvent, MessageEvent, CloseEvent } from 'sockjs-client';
import { SessionAction, Session } from './session';

export interface SocketEvent {
  type: string;
  detail: any;
}

export class Socket {
  connected = false;

  socket: WebSocket;

  constructor(url: string, sessionId: string | undefined, private dispatch: (action: SessionAction) => void) {
    const options: Options = {};
    if (sessionId) options.sessionId = () => sessionId;

    this.socket = new sockjs(url, undefined, options);
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('error', this.onError);
    this.socket.addEventListener('close', this.onClose);
  }

  send(type: string, detail: any) {
    this.socket.send(JSON.stringify({ type, detail }));
  }

  private onOpen = (event: OpenEvent) => {
    this.dispatch({ type: 'socket', payload: { status: 'connected' } });
  };

  private onMessage = (event: MessageEvent) => {
    const { type, detail }: SocketEvent = JSON.parse(event.data);
    this.dispatch({ type, payload: detail } as SessionAction);
  };

  private onError = (event: Event) => {};

  private onClose = (event: CloseEvent) => {
    this.dispatch({ type: 'socket', payload: { status: 'disconnected' } });
  };
}
