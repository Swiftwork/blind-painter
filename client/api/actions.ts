import { SessionContext, Point } from './session';
import { Socket } from './socket';
import { createContext } from 'react';

export class Actions {
  private state: Session;
  private socket: Socket;

  private isDrawing = false;
  private inThrottle = false;

  constructor(state: Session, socket: Socket, updateCallback: () => void) {
    this.state = state;
    this.socket = socket;
  }

  onClear = () => {
    const points = this.state.updateClient(this.state.id, []);
    this.update(this.state.id, points);
  };

  onUndo = () => {};

  onRedo = () => {};

  onDone = () => {};

  onTouchStart = (event: TouchEvent | MouseEvent) => {
    if (!this.state.connected) return;
    event.preventDefault();
    this.isDrawing = true;
    const x = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const y = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    const points = this.state.updateClient(this.state.id, { x, y });
    this.update(this.state.id, points);
  };

  onTouchMove = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    const x = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const y = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    if (this.isDrawing) {
      const points = this.state.updateClient(this.state.id, { x, y });
      this.update(this.state.id, points);
    }
  };

  onTouchEnd = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    this.isDrawing = false;
  };

  private update(id: string | null, points: Point[] | undefined) {
    if (!this.inThrottle) {
      this.socket.send({ type: 'update', detail: { id, points } });
      this.inThrottle = true;
      setTimeout(() => (this.inThrottle = false), 50);
    }
  }
}
