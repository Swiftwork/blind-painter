import React, { Component } from 'react';
import { SessionContext } from 'api/session';

import s from './Menu.module.css';

interface Props {
  onConnect(participate: boolean, name: string, code?: string): void;
}

interface State {
  host: boolean | undefined;
  name: string;
  code: string;
}

export class Menu extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      host: undefined,
      name: '',
      code: '',
    };
  }

  public render() {
    return (
      <form className={s.menu}>
        <h1 className={s.title}>Blind Painter</h1>
        {typeof this.state.host == 'undefined' ? (
          <>
            <button className={s.button} type="button" onClick={() => this.setState({ host: true })}>
              Host venue
            </button>
            <menu style={{ margin: 0 }}>
              <input
                className={s.input}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                maxLength={8}
                value={this.state.code}
                onChange={event => this.setState({ code: event.currentTarget.value })}
              />
              <button type="button" className={s.button} onClick={() => this.setState({ host: false })}>
                Attend venue
              </button>
            </menu>
          </>
        ) : (
          <>
            <input
              className={s.input}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              maxLength={16}
              value={this.state.name}
              onChange={event => this.setState({ name: event.currentTarget.value })}
            />
            <button
              className={s.button}
              type="button"
              onClick={() => this.props.onConnect(true, this.state.name, this.state.code)}>
              Join as painter
            </button>
            <button
              className={s.button}
              type="button"
              onClick={() => this.props.onConnect(false, this.state.name, this.state.code)}>
              Join as critic
            </button>
          </>
        )}
      </form>
    );
  }
}
