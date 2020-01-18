import React, { Component, FormEvent } from 'react';

import { SessionContext } from 'context/store';

import s from './Guess.module.css';

interface Props {}

interface State {
  guess: string;
  sent: boolean;
}

export class Guess extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      guess: '',
      sent: false,
    };
  }

  onSubmit = (event: FormEvent) => {
    if (!this.state.guess) return;
    event.preventDefault();
    this.context.dispatch({ type: 'GUESS', payload: { guess: this.state.guess } });
    this.setState({ sent: true });
  };

  public render() {
    return (
      <form className={s.guess} onSubmit={this.onSubmit}>
        <div className={s.wrapper}>
          <input
            className={`${s.input}`}
            placeholder={this.context.blind ? 'Painting depicts?' : 'Blind suspect?'}
            value={this.state.guess}
            onChange={event => this.setState({ guess: event.currentTarget.value, sent: false })}
          />
          <input
            className={`${s.button} ${this.state.sent ? s.sent : ''}`}
            type="submit"
            value={!this.state.sent ? 'send' : 'sent'}
          />
        </div>
      </form>
    );
  }
}
