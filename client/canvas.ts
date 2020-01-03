import { State, Point } from './state';

export class Canvas {
  private canvas: HTMLCanvasElement;
  private state: State;
  private ctx: CanvasRenderingContext2D | null;

  constructor(canvas: HTMLCanvasElement, state: State) {
    this.canvas = canvas;
    this.state = state;
    this.ctx = canvas.getContext('2d');

    window.addEventListener('resize', this.onResize);
    this.onResize();
  }

  private onResize = () => {
    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;
  };

  draw() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.shadowBlur = 1;
    this.ctx.lineWidth = 6;
    this.ctx.lineJoin = this.ctx.lineCap = 'round';

    for (const [_, client] of this.state.clients) {
      if (!client.first.length) continue;
      this.ctx.strokeStyle = client.color;
      this.ctx.shadowColor = client.color;
      let p1 = client.first[0];
      let p2 = client.first[1];

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);

      for (let i = 1, len = client.first.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const midPoint = Canvas.midPointBtw(p1, p2);
        this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = client.first[i];
        p2 = client.first[i + 1];
      }
      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      this.ctx.lineTo(p1.x, p1.y);
      this.ctx.stroke();
      this.ctx.strokeStyle = '#000';
    }
  }

  destroy() {
    window.removeEventListener('resize', this.onResize);
  }

  static midPointBtw(p1: Point, p2: Point) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2,
    };
  }
}
