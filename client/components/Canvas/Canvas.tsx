import React, { Component, createRef, MouseEvent as RMouseEvent, TouchEvent as RTouchEvent } from 'react';

import { SessionContext, Point } from '../../api/session';

import canvasTile from 'assets/canvas-small.jpg';

interface Props {}

interface State {
  width: number;
  height: number;
}

export class Canvas extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private ctx: CanvasRenderingContext2D | null = null;
  private pattern: CanvasPattern | null = null;
  private $canvas = createRef<HTMLCanvasElement>();
  private isDrawing = false;

  constructor(props: Props) {
    super(props);

    this.state = {
      width: 0,
      height: 0,
    };

    // Load the image
    const img = new Image();
    img.src = canvasTile;
    img.onload = () => {
      if (!this.ctx) return;
      this.pattern = this.ctx.createPattern(img, 'repeat');
      this.draw();
    };
  }

  componentDidMount() {
    if (this.$canvas.current) {
      this.ctx = this.$canvas.current.getContext('2d');
      window.addEventListener('resize', this.onResize);
      this.onResize();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  componentDidUpdate() {
    this.draw();
  }

  private onResize = () => {
    this.setState(
      {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
      },
      () => {
        this.draw();
      },
    );
  };

  onTouchStart = (event: RTouchEvent | RMouseEvent) => {
    if (!this.context.connected) return;
    event.preventDefault();
    this.isDrawing = true;
    this.context.dispatch({ type: 'update', payload: { points: Canvas.GetCoords(event) } });
    this.draw();
  };

  onTouchMove = (event: RTouchEvent | RMouseEvent) => {
    event.preventDefault();
    if (this.isDrawing) {
      this.context.dispatch({ type: 'update', payload: { points: Canvas.GetCoords(event) } });
      this.draw();
    }
  };

  onTouchEnd = (event: RTouchEvent | RMouseEvent) => {
    event.preventDefault();
    this.isDrawing = false;
  };

  render() {
    return (
      <canvas
        ref={this.$canvas}
        id="canvas"
        width={this.state.width}
        height={this.state.height}
        onTouchStart={this.onTouchStart}
        onMouseDown={this.onTouchStart}
        onTouchMove={this.onTouchMove}
        onMouseMove={this.onTouchMove}
        onTouchEnd={this.onTouchEnd}
        onMouseUp={this.onTouchEnd}
      />
    );
  }

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
    for (const [_, client] of this.context.clients) {
      for (const itteration of client.itterations) {
        if (!itteration.length) continue;
        this.drawLine(itteration, client.color);
      }
    }
    this.ctx.globalCompositeOperation = 'source-over';
  }

  drawLine(points: Point[], color: string) {
    if (!this.ctx) return;

    this.ctx.strokeStyle = color;
    this.ctx.shadowColor = color;
    let p1 = points[0];
    let p2 = points[1];

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x, p1.y);

    for (let i = 1, len = points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      const midPoint = Canvas.midPointBtw(p1, p2);
      this.ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
      p1 = points[i];
      p2 = points[i + 1];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    this.ctx.lineTo(p1.x, p1.y);
    this.ctx.stroke();
    this.ctx.strokeStyle = '#000';
  }

  static GetCoords(event: RTouchEvent | RMouseEvent) {
    let x = 0;
    let y = 0;
    if (Canvas.IsTouch(event)) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else {
      x = event.nativeEvent.clientX;
      y = event.nativeEvent.clientY;
    }
    return { x, y };
  }

  static IsTouch(event: RTouchEvent | RMouseEvent): event is RTouchEvent {
    return event.nativeEvent instanceof TouchEvent;
  }

  static midPointBtw(p1: Point, p2: Point) {
    return {
      x: p1.x + (p2.x - p1.x) / 2,
      y: p1.y + (p2.y - p1.y) / 2,
    };
  }
}
