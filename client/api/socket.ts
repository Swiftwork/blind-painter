import sockjs, { Options, OpenEvent, MessageEvent, CloseEvent } from 'sockjs-client';
import { EventEmitter } from './emitter';

export interface SocketEvent {
  type: string;
  detail: any;
}

export class Socket extends EventEmitter<'setting' | 'update'> {
  connected = false;

  socket: WebSocket;

  constructor(url: string, sessionId: string | null) {
    super();

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
    this.connected = true;
  };

  private onMessage = (event: MessageEvent) => {
    const data: SocketEvent = JSON.parse(event.data);
    switch (data.type) {
      case 'setting':
        this.emit('setting', data.detail);
        break;
      case 'update':
        this.emit('update', data.detail);
        break;
    }
  };

  private onError = (event: Event) => {};

  private onClose = (event: CloseEvent) => {
    this.connected = false;
  };
}
