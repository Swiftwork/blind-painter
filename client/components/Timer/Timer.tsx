import React, { Component } from 'react';

import { SessionContext } from 'context/store';

import s from './Timer.module.css';

interface Props {}

interface State {
  remaining: number;
}

export class Timer extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private timer: number | undefined;
  private turnId: string | undefined;

  constructor(props: Props) {
    super(props);

    this.state = {
      remaining: Infinity,
    };
  }

  componentDidUpdate() {
    if (this.turnId !== this.context.turnId) {
      this.turnId = this.context.turnId;
      this.newTurn();
    }
  }

  componentWillUnmount() {
    window.clearInterval(this.timer);
  }

  newTurn() {
    this.setState({
      remaining: Math.round((this.context.turnDuration - this.context.turnElapsed) / 1000),
    });

    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.setState({
        remaining: Math.max(0, this.state.remaining - 1),
      });
    }, 1000);
  }

  public render() {
    return (
      <div
        className={`${s.timer} ${this.state.remaining <= 10 ? s.emphasis : ''} ${
          this.context.stage === 'guessing' ? s.guessing : ''
        }`}>
        {this.state.remaining}
      </div>
    );
  }
}
