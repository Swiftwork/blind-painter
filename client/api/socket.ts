import sockjs, { Options, OpenEvent, MessageEvent, CloseEvent } from 'sockjs-client';
import { SessionAction } from './session';

export interface SocketEvent {
  type: string;
  detail: any;
}

export class Socket {
  connected = false;

  socket: WebSocket;

  constructor(url: string, sessionId: string | null, private dispatch: (action: SessionAction) => void) {
    const options: Options = {};
    if (sessionId) options.sessionId = () => sessionId;

    this.socket = new sockjs(url, undefined, options);
    this.socket.addEventListener('open', this.onOpen);
    this.socket.addEventListener('message', this.onMessage);
    this.socket.addEventListener('error', this.onError);
    this.socket.addEventListener('close', this.onClose);
  }

  send(event: SocketEvent) {
    this.socket.send(JSON.stringify(event));
  }

  private onOpen = (event: OpenEvent) => {
    this.dispatch({ type: 'socket', payload: { status: 'connected' } });
  };

  private onMessage = (event: MessageEvent) => {
    const data: SocketEvent = JSON.parse(event.data);
    switch (data.type) {
      case 'session':
        this.dispatch({ type: 'session', payload: data.detail });
        break;
      case 'update':
        //this.emit('update', data.detail);
        break;
    }
  };

  private onError = (event: Event) => {};

  private onClose = (event: CloseEvent) => {
    this.dispatch({ type: 'socket', payload: { status: 'disconnected' } });
  };
}
