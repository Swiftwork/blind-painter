import React, { Component } from 'react';
import { SessionContext } from 'api/session';

import s from './Menu.module.css';

interface Props {
  onConnect(participate: boolean, name: string, code?: string): void;
  onStart(code?: string): void;
}

interface State {
  stage: 'code' | 'name' | 'lobby' | 'game';
  host: boolean;
  name: string;
  code: string;
}

export class Menu extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  constructor(props: Props) {
    super(props);

    this.state = {
      stage: 'code',
      host: false,
      name: '',
      code: '',
    };
  }

  public codeMenu() {
    return (
      <>
        <button className={s.button} type="button" onClick={() => this.setState({ stage: 'name', host: true })}>
          Host venue
        </button>
        <menu style={{ margin: 0 }}>
          <input
            className={s.input}
            placeholder="code"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={8}
            value={this.state.code}
            onChange={event => this.setState({ code: event.currentTarget.value })}
          />
          <button type="button" className={s.button} onClick={() => this.setState({ stage: 'name', host: false })}>
            Attend venue
          </button>
        </menu>
      </>
    );
  }

  public nameMenu() {
    return (
      <>
        <input
          className={s.input}
          placeholder="name"
          style={{ marginBottom: '2rem', maxWidth: '12em' }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          maxLength={16}
          value={this.state.name}
          onChange={event => this.setState({ name: event.currentTarget.value })}
        />
        <div className={s.break} />
        <button
          className={s.button}
          type="button"
          onClick={() => {
            this.setState({ stage: 'lobby' });
            this.props.onConnect(true, this.state.name, this.state.code);
          }}>
          Join as painter
        </button>
        <button
          className={s.button}
          type="button"
          onClick={() => {
            this.setState({ stage: 'lobby' });
            this.props.onConnect(false, this.state.name, this.state.code);
          }}>
          Join as critic
        </button>
      </>
    );
  }

  public lobbyMenu() {
    return (
      this.state.host && (
        <>
          <button
            className={s.button}
            type="button"
            onClick={() => {
              this.setState({ stage: 'game' });
              this.props.onStart();
            }}>
            Start the game
          </button>
          <button className={s.button} type="button">
            Settings
          </button>
        </>
      )
    );
  }

  public renderMenu() {
    switch (this.state.stage) {
      case 'code':
        return this.codeMenu();
      case 'name':
        return this.nameMenu();
      case 'lobby':
        return this.lobbyMenu();
    }
    return undefined;
  }

  public render() {
    return (
      this.state.stage !== 'game' && (
        <form className={s.menu}>
          <h1 className={s.title}>Blind Painter</h1>
          {this.renderMenu()}
        </form>
      )
    );
  }
}
