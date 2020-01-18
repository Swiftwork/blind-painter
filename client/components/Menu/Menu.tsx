import React, { Component } from 'react';
import QRCode from 'qrcode';

import { SessionContext } from 'context/store';

import s from './Menu.module.css';

interface Props {
  onConnect(participant: boolean, name: string, code?: string): void;
  onStart(): void;
  onQuit(): void;
}

interface State {
  stage: 'code' | 'name';
  host: boolean;
  name: string;
  code: string;
}

export class Menu extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private qrCanvas = React.createRef<HTMLCanvasElement>();
  private qrRendered = '';

  constructor(props: Props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || '';

    this.state = {
      stage: code ? 'name' : 'code',
      host: false,
      name: '',
      code,
    };
  }

  componentDidMount() {
    const client = this.context.clients.get(this.context.clientId);
    if (client)
      this.setState({
        stage: 'name',
        host: this.context.clientId == this.context.hostId,
        name: client.name,
        code: this.context.code,
      });
  }

  componentDidUpdate() {
    if (this.qrCanvas.current && this.qrRendered !== this.context.code) {
      this.setState({ stage: 'code' });
      QRCode.toCanvas(this.qrCanvas.current, `${window.location.href.split('?')[0]}?code=${this.context.code}`, err => {
        if (err) return console.warn('Failed to render QR code');
        this.qrRendered = this.context.code;
      });
    }
  }

  public codeMenu() {
    return (
      <>
        <button
          className={s.button}
          type="button"
          onClick={() => this.setState({ stage: 'name', host: true, code: '' })}>
          Host venue
        </button>
        <menu className={s.group}>
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
          style={{ maxWidth: '12em' }}
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
            this.props.onConnect(true, this.state.name, this.state.code);
          }}>
          Join as painter
        </button>
        <button
          className={s.button}
          type="button"
          onClick={() => {
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
          <canvas ref={this.qrCanvas} />
          <h2 className={s.code}>
            Code: <em>{this.context.code}</em>
          </h2>
          <button className={s.button} type="button" onClick={this.props.onStart}>
            Start the game
          </button>
          <button className={s.button} type="button" onClick={this.props.onQuit}>
            Quit
          </button>
        </>
      )
    );
  }

  public renderMenu() {
    if (this.context.stage == 'lobby') {
      return this.lobbyMenu();
    } else {
      switch (this.state.stage) {
        case 'code':
          return this.codeMenu();
        case 'name':
          return this.nameMenu();
      }
    }
  }

  public render() {
    return (
      <form className={s.menu} onSubmit={event => event.preventDefault()}>
        <h1 className={s.title}>Blind Painter</h1>
        {this.renderMenu()}
      </form>
    );
  }
}
