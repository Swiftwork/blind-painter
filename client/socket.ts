import sockjs, { Options, OpenEvent, MessageEvent, CloseEvent } from 'sockjs-client';
import { State } from './state';
import { Canvas } from './canvas';

export interface SocketEvent {
  type: string;
  detail: any;
}

export class Socket {
  private socket: WebSocket;
  private canvas: Canvas;
  private state: State;

  constructor(url: string, canvas: Canvas, state: State) {
    this.canvas = canvas;
    this.state = state;

    const options: Options = {};
    if (this.state.id) options.sessionId = () => this.state.id as string;

    this.socket = new sockjs(url, undefined, options);
    this.socket.onopen = this.onOpen;
    this.socket.onmessage = this.onMessage;
    this.socket.onerror = this.onError;
    this.socket.onclose = this.onClose;
  }

  send(event: SocketEvent) {
    this.socket.send(JSON.stringify(event));
  }

  private onOpen = (event: OpenEvent) => {};

  private onMessage = (event: MessageEvent) => {
    const data: SocketEvent = JSON.parse(event.data);
    switch (data.type) {
      case 'setting':
        if (!this.state.id) this.state.id = data.detail.id;
        break;
      case 'update':
        this.state.updateClient(data.detail.id, data.detail.points);
        this.canvas.draw();
        break;
    }
  };

  private onError = (event: Event) => {};

  private onClose = (event: CloseEvent) => {};
}
