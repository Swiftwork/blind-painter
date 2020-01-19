import React, { Component, createRef } from 'react';
import Wordcloud, { ListEntry } from 'wordcloud';

import s from './Reveal.module.css';

import TadaA from 'assets/sounds/tada-fanfare-a.mp3';
import TadaF from 'assets/sounds/tada-fanfare-f.mp3';
import TadaG from 'assets/sounds/tada-fanfare-g.mp3';

import { Util } from 'api/util.ts';
import { SessionContext } from 'context/store';

type Stage = 'suspect' | 'blind' | 'guess' | 'subject' | 'ended';

interface Props {}

interface State {
  stage: Stage;
  width: number;
  height: number;
  words: ListEntry[];
}

export class Reveal extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private order: Stage[] = ['suspect', 'blind', 'guess', 'subject', 'ended'];
  private index = 0;
  private timer: number | undefined;

  private revealSounds = [new Audio(TadaA), new Audio(TadaF), new Audio(TadaG)];

  private $canvas = createRef<HTMLCanvasElement>();

  constructor(props: Props) {
    super(props);

    this.revealSounds.forEach(sound => {
      sound.load();
    });

    this.state = {
      stage: 'suspect',
      width: 0,
      height: 0,
      words: [],
    };
  }

  componentDidMount() {
    if (this.$canvas.current) {
      window.addEventListener('resize', this.onResize);
      this.onResize();
      this.reveal();
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.timer);
  }

  private reveal() {
    if (this.context.hostId == this.context.clientId) Util.random(this.revealSounds).play();

    this.setState(
      {
        stage: this.order[this.index],
      },
      () => {
        this.renderWordcloud();
      },
    );

    if (this.state.stage === 'ended') return;

    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.index++;
      this.reveal();
    }, Math.min(1000 * 15, this.context.turnDuration / 5));
  }

  private onResize = () => {
    const desiredWidth = Math.min(document.body.clientWidth, document.body.clientHeight * 0.8);
    const desiredHeight = desiredWidth;

    this.setState(
      {
        width: desiredWidth,
        height: desiredHeight,
      },
      () => {
        this.renderWordcloud();
      },
    );
  };

  private renderWordcloud() {
    if (!this.$canvas.current) return;

    const list = Array.from(
      Util.weightedMap(this.state.stage == 'suspect' ? this.context.suspects : this.context.guesses).entries(),
    );

    Wordcloud(this.$canvas.current, {
      list,
      fontFamily: 'Permanent Marker, cursive',
      gridSize: Math.round((6 * this.state.width) / 128),
      weightFactor: size => Math.max(48, (Math.pow(size, 2.2) * this.state.width) / 128),
      backgroundColor: 'rgba(0,0,0,0)',
      minRotation: -0.5,
      maxRotation: 0.5,
      rotateRatio: 0.5,
    });
  }

  private title() {
    switch (this.state.stage) {
      case 'suspect':
        return 'These are your suspects:';
      case 'blind':
        return 'The actual blind painter is:';
      case 'guess':
        return 'These are your guesses based on the artwork:';
      case 'subject':
        return 'The actual subject was:';
      case 'ended':
        return 'Thank you for playing!';
    }
  }

  private getBlindPainter() {
    if (this.context.blindId) {
      const client = this.context.clients.get(this.context.blindId);
      if (client) return client;
    }
    return { name: `I don't know who is blind`, color: '#be0f0f' };
  }

  public render() {
    const blindClient = this.getBlindPainter();

    return (
      <div className={s.reveal}>
        <h2 className={s.title}>{this.title()}</h2>
        {this.state.stage == 'blind' && (
          <h3 className={s.answer} style={{ color: blindClient.color }}>
            {blindClient.name}
          </h3>
        )}
        {this.state.stage == 'subject' && (
          <h3 className={s.answer}>{this.context.subject || `I don't know the subject`}</h3>
        )}
        {(this.state.stage == 'suspect' || this.state.stage == 'guess') && (
          <canvas className={s.canvas} ref={this.$canvas} width={this.state.width} height={this.state.height} />
        )}
      </div>
    );
  }
}
