import { Canvas } from './canvas';
import { State } from './state';
import { Socket } from 'socket';

export class Actions {
  private $canvas: HTMLCanvasElement;
  private canvas: Canvas;
  private state: State;
  private isDrawing = false;
  private socket: Socket;

  constructor($canvas: HTMLCanvasElement, canvas: Canvas, state: State, socket: Socket) {
    this.$canvas = $canvas;
    this.canvas = canvas;
    this.state = state;
    this.socket = socket;

    this.$canvas.addEventListener('touchstart', this.onTouchStart);
    this.$canvas.addEventListener('mousedown', this.onTouchStart);

    this.$canvas.addEventListener('touchmove', this.onTouchMove);
    this.$canvas.addEventListener('mousemove', this.onTouchMove);

    this.$canvas.addEventListener('touchend', this.onTouchEnd);
    this.$canvas.addEventListener('mouseup', this.onTouchEnd);
  }

  onTouchStart = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    this.isDrawing = true;
    const x = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const y = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    const points = this.state.updateClient(undefined, { x, y });
    this.canvas.draw();
    this.socket.send({ type: 'update', detail: { id: this.state.id, points } });
  };

  onTouchMove = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    const x = event instanceof TouchEvent ? event.touches[0].clientX : event.clientX;
    const y = event instanceof TouchEvent ? event.touches[0].clientY : event.clientY;
    if (this.isDrawing) {
      const points = this.state.updateClient(undefined, { x, y });
      this.canvas.draw();
      this.socket.send({ type: 'update', detail: { id: this.state.id, points } });
    }
  };

  onTouchEnd = (event: TouchEvent | MouseEvent) => {
    event.preventDefault();
    this.isDrawing = false;
  };
}
