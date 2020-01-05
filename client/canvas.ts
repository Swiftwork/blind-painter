import { State, Point } from './state';

import canvasTile from './assets/canvas-small.jpg';

export class Canvas {
  private state: State;
  private ctx: CanvasRenderingContext2D | null;
  private pattern: CanvasPattern | null = null;

  $canvas: HTMLCanvasElement;

  constructor(state: State) {
    this.state = state;
    this.$canvas = document.createElement('canvas');
    this.$canvas.id = 'canvas';
    this.ctx = this.$canvas.getContext('2d');
    document.body.appendChild(this.$canvas);

    window.addEventListener('resize', this.onResize);
    this.onResize();

    // Load the image
    const img = new Image();
    img.src = canvasTile;
    img.onload = () => {
      if (!this.ctx) return;
      this.pattern = this.ctx.createPattern(img, 'repeat');
      this.draw();
    };
  }

  private onResize = () => {
    this.$canvas.width = document.body.clientWidth;
    this.$canvas.height = document.body.clientHeight;
  };

  draw() {
    if (!this.ctx) return;

    if (this.pattern) {
      this.ctx.fillStyle = this.pattern;
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.fillStyle = '#000';
    } else {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    this.ctx.shadowBlur = 1;
    this.ctx.lineWidth = 8;
    this.ctx.lineJoin = this.ctx.lineCap = 'round';

    this.ctx.globalCompositeOperation = 'overlay';
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
    this.ctx.globalCompositeOperation = 'source-over';
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
