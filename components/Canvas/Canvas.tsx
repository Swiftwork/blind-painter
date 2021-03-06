import React, { Component, createRef, MouseEvent as RMouseEvent, TouchEvent as RTouchEvent } from 'react';

import { SessionContext } from 'context/store';

import s from './Canvas.module.css';

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
  private drawFrame = 0;
  private drawTimestamp = 0;
  private drawTime = 0;
  private inputThrottle = false;

  private baseHeight = 740;

  constructor(props: Props) {
    super(props);

    this.state = {
      ratio: 2,
      scale: 1,
      width: this.baseHeight / 2,
      height: this.baseHeight,
    };
  }

  componentDidMount() {
    if (this.$canvas.current) {
      this.ctx = this.$canvas.current.getContext('2d');
      window.addEventListener('resize', this.onResize);
      this.drawFrame = window.requestAnimationFrame(this.draw);
      this.onResize();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
    window.cancelAnimationFrame(this.drawFrame);
  }

  private onResize = () => {
    const desiredHeight = document.body.clientHeight;
    const desiredWidth = desiredHeight / this.state.ratio;

    this.setState({
      width: desiredWidth,
      height: desiredHeight,
      scale: desiredHeight / this.baseHeight,
    });
  };

  onTouchStart = (event: RTouchEvent | RMouseEvent) => {
    if (this.context.turnId !== this.context.clientId) return;
    event.preventDefault();
    this.isDrawing = true;
    this.context.dispatch({ type: 'C2S_DRAW_START', payload: { points: Canvas.GetCoords(event, this.state.scale) } });
  };

  onTouchMove = (event: RTouchEvent | RMouseEvent) => {
    if (this.context.turnId !== this.context.clientId) return;
    event.preventDefault();
    if (!this.inputThrottle && this.isDrawing) {
      this.inputThrottle = true;
      this.context.dispatch({ type: 'C2S_DRAW', payload: { points: Canvas.GetCoords(event, this.state.scale) } });
      setTimeout(() => {
        this.inputThrottle = false;
      }, this.drawTime / 2);
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

  draw = (timestamp: number) => {
    if (!this.ctx) return;

    if (this.drawTimestamp) {
      const delta = timestamp - this.drawTimestamp;
      this.drawTime = this.drawTime * 0.9 + delta * (1.0 - 0.9);
    }
    this.drawTimestamp = timestamp;

    if (this.pattern) {
      this.ctx.fillStyle = this.pattern;
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
      this.ctx.fillStyle = '#000';
    } else {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    this.ctx.lineWidth = 6 * this.state.scale;
    this.ctx.lineJoin = this.ctx.lineCap = 'round';

    for (let i = 0; i < this.context.currentRound; i++) {
      for (const clientId of this.context.turnOrder) {
        const client = this.context.clients.get(clientId);
        if (!client) continue;
        const iteration = client.iterations[i];
        if (!iteration || !iteration.length) continue;
        this.drawLine(iteration.flat(), client.color);
      }
    }

    this.drawFrame = window.requestAnimationFrame(this.draw);
  };

  drawLine(points: number[], color: string) {
    if (!this.ctx) return;

    this.ctx.strokeStyle = color;
    this.ctx.shadowColor = color;
    let x1 = points[0];
    let y1 = points[1];
    let x2 = points[2];
    let y2 = points[3];

    this.ctx.beginPath();
    this.ctx.moveTo(x1 * this.state.scale, x1 * this.state.scale);

    for (let i = 2, len = points.length; i < len; i += 2) {
      // we pick the point between pi+1 & pi+2 as the
      // end point and p1 as our control point
      const midPoint = Canvas.midPointBtw(x1, y1, x2, y2);
      this.ctx.quadraticCurveTo(
        x1 * this.state.scale,
        y1 * this.state.scale,
        midPoint.x * this.state.scale,
        midPoint.y * this.state.scale,
      );
      x1 = points[i + 0];
      y1 = points[i + 1];
      x2 = points[i + 2];
      y2 = points[i + 3];
    }
    // Draw last line as a straight line while
    // we wait for the next point to be able to calculate
    // the bezier control point
    this.ctx.lineTo(x1 * this.state.scale, y1 * this.state.scale);
    this.ctx.stroke();
    this.ctx.strokeStyle = '#000';
  }

  static GetCoords(event: RTouchEvent | RMouseEvent, scale: number): [number, number] {
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
    x = Math.round((x + Number.EPSILON) * 100) / 100;
    y = Math.round((y + Number.EPSILON) * 100) / 100;
    return [x, y];
  }

  static IsTouch(event: RTouchEvent | RMouseEvent): event is RTouchEvent {
    return event.nativeEvent instanceof TouchEvent;
  }

  static midPointBtw(x1: number, y1: number, x2: number, y2: number) {
    return {
      x: x1 + (x2 - x1) / 2,
      y: y1 + (y2 - y1) / 2,
    };
  }
}
