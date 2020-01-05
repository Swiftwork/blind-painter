import { Canvas } from './canvas';
import { State, Point } from './state';
import { Socket } from 'socket';

export class Actions {
  private canvas: Canvas;
  private state: State;
  private isDrawing = false;
  private socket: Socket;

  constructor(canvas: Canvas, state: State, socket: Socket) {
    this.canvas = canvas;
    this.state = state;
    this.socket = socket;

    canvas.$canvas.addEventListener('touchstart', this.onTouchStart);
    canvas.$canvas.addEventListener('mousedown', this.onTouchStart);

    canvas.$canvas.addEventListener('touchmove', this.onTouchMove);
    canvas.$canvas.addEventListener('mousemove', this.onTouchMove);

    canvas.$canvas.addEventListener('touchend', this.onTouchEnd);
    canvas.$canvas.addEventListener('mouseup', this.onTouchEnd);
  }

  onClear = () => {
    const points = this.state.updateClient(undefined, []);
    this.update(this.state.id, points);
  };

  onUndo = () => {};

  onRedo = () => {};

  onDone = () => {};

  onTouchStart = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    this.isDrawing = true;
    const x = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const y = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    const points = this.state.updateClient(undefined, { x, y });
    this.update(this.state.id, points);
  };

  onTouchMove = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    const x = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const y = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    if (this.isDrawing) {
      const points = this.state.updateClient(undefined, { x, y });
      this.update(this.state.id, points);
    }
  };

  onTouchEnd = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    this.isDrawing = false;
  };

  private update(id: string | null, points: Point[] | undefined) {
    this.canvas.draw();
    this.socket.send({ type: 'update', detail: { id: this.state.id, points } });
  }
}
