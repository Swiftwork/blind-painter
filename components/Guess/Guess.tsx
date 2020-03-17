import React, { Component, FormEvent } from 'react';

import { SessionContext } from 'context/store';
import { Util } from 'client/util';

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
    this.context.dispatch({ type: 'C2S_GUESS', payload: { guess: this.state.guess } });
    this.setState({ sent: true });
  };

  public render() {
    const [painters] = Util.partition(Array.from(this.context.clients.values()), client => client.participant);
    return (
      <form className={s.guess} onSubmit={this.onSubmit}>
        <div className={s.wrapper}>
          {this.context.blind ? (
            <input
              className={`${s.input}`}
              placeholder={'Painting depicts?'}
              value={this.state.guess}
              onChange={event => this.setState({ guess: event.currentTarget.value, sent: false })}
            />
          ) : (
            <select
              className={`${s.input}`}
              value={this.state.guess}
              onChange={event => this.setState({ guess: event.currentTarget.value, sent: false })}>
              <option value="" disabled hidden>
                Blind painter?
              </option>
              {painters.map(({ id, name }) =>
                id !== this.context.clientId ? (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ) : (
                  false
                ),
              )}
            </select>
          )}
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
