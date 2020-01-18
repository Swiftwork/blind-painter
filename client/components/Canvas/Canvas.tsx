import React, { Component, createRef, MouseEvent as RMouseEvent, TouchEvent as RTouchEvent } from 'react';

import { Point } from 'context/interfaces';
import { SessionContext } from 'context/store';

import s from './Canvas.module.css';

//import canvasTile from 'assets/canvas-small.jpg';

interface Props {}

interface State {
  ratio: number;
  scale: number;
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

  private baseHeight = 740;

  constructor(props: Props) {
    super(props);

    this.state = {
      ratio: 2,
      scale: 1,
      width: this.baseHeight / 2,
      height: this.baseHeight,
    };

    /*
    // Load the image
    const img = new Image();
    img.src = canvasTile;
    img.onload = () => {
      if (!this.ctx) return;
      this.pattern = this.ctx.createPattern(img, 'repeat');
      this.draw();
    };
    */
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
    const desiredHeight = document.body.clientHeight;
    const desiredWidth = desiredHeight / this.state.ratio;

    this.setState(
      {
        width: desiredWidth,
        height: desiredHeight,
        scale: desiredHeight / this.baseHeight,
      },
      () => {
        this.draw();
      },
    );
  };

  onTouchStart = (event: RTouchEvent | RMouseEvent) => {
    if (this.context.turnId !== this.context.clientId) return;
    event.preventDefault();
    this.isDrawing = true;
    this.context.dispatch({ type: 'DRAW_START', payload: { points: Canvas.GetCoords(event, this.state.scale) } });
    this.draw();
  };

  onTouchMove = (event: RTouchEvent | RMouseEvent) => {
    if (this.context.turnId !== this.context.clientId) return;
    event.preventDefault();
    if (this.isDrawing) {
      this.context.dispatch({ type: 'DRAW', payload: { points: Canvas.GetCoords(event, this.state.scale) } });
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
        className={s.canvas}
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
      //this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.fillStyle = '#000';
    } else {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    this.ctx.lineWidth = 6 * this.state.scale;
    this.ctx.lineJoin = this.ctx.lineCap = 'round';

    for (const [_, client] of this.context.clients) {
      for (const itteration of client.itterations) {
        if (!itteration.length) continue;
        this.drawLine(itteration.flat(), client.color);
      }
    }
  }

  drawLine(points: Point[], color: string) {
    if (!this.ctx) return;

    this.ctx.strokeStyle = color;
    this.ctx.shadowColor = color;
    let p1 = points[0];
    let p2 = points[1];

    this.ctx.beginPath();
    this.ctx.moveTo(p1.x * this.state.scale, p1.y * this.state.scale);

    for (let i = 1, len = points.length; i < len; i++) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      const midPoint = Canvas.midPointBtw(p1, p2);
      this.ctx.quadraticCurveTo(
        p1.x * this.state.scale,
        p1.y * this.state.scale,
        midPoint.x * this.state.scale,
        midPoint.y * this.state.scale,
      );
      p1 = points[i];
      p2 = points[i + 1];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    this.ctx.lineTo(p1.x * this.state.scale, p1.y * this.state.scale);
    this.ctx.stroke();
    this.ctx.strokeStyle = '#000';
  }

  static GetCoords(event: RTouchEvent | RMouseEvent, scale: number) {
    const offset = event.currentTarget.getBoundingClientRect();
    let x = 0;
    let y = 0;
    if (Canvas.IsTouch(event)) {
      x = (event.touches[0].clientX - offset.x) / scale;
      y = (event.touches[0].clientY - offset.y) / scale;
    } else {
      x = (event.nativeEvent.clientX - offset.x) / scale;
      y = (event.nativeEvent.clientY - offset.y) / scale;
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
