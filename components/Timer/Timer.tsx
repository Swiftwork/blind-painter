import React, { Component } from 'react';

import { SessionContext } from 'context/store';

import s from './Timer.module.css';

import Beep from 'assets/sounds/beep.mp3';

interface Props {}

interface State {
  remaining: number;
}

export class Timer extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private timer: number | undefined;
  private turnId: string | undefined;

  private beep = new Audio(Beep);

  constructor(props: Props) {
    super(props);

    this.beep.load();

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

  playBeep = () => {
    this.beep.pause();
    this.beep.currentTime = 0;
    if (this.context.hostId == this.context.clientId) {
      this.beep.volume = this.context.soundVolume / 100;
      this.beep.play();
    }
  };

  newTurn() {
    this.setState({
      remaining: Math.round((this.context.turnDuration - this.context.turnElapsed) / 1000),
    });

    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      const remaining = Math.max(0, this.state.remaining - 1);
      if (remaining <= 10) this.playBeep();
      this.setState({
        remaining,
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
