import React, { Component } from 'react';
import QRCode from 'qrcode';

import { Server } from 'client/server';
import { SessionContext } from 'context/store';
import { Category, Group, isGroup, isCategory } from 'shared/interfaces';

import s from './Menu.module.css';

interface Props {
  onConnect(participant: boolean, name: string, code?: string): void;
  onStart(categoryId: string): void;
  onSettings(): void;
  onQuit(): void;
}

interface State {
  stage: 'code' | 'name';
  host: boolean;
  name: string;
  code: string;
  categoryId: string;
  categories: (Category | Group)[];
}

export class Menu extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private qrCanvas = React.createRef<HTMLCanvasElement>();
  private qrRendered = '';

  constructor(props: Props) {
    super(props);

    this.state = {
      stage: 'code',
      host: false,
      name: '',
      code: '',
      categories: [],
      categoryId: '',
    };
  }

  componentDidMount() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || '';

    this.setState({
      stage: code ? 'name' : 'code',
      code,
    });

    const client = this.context.clients.get(this.context.clientId);
    if (client) {
      this.setState({
        stage: 'name',
        host: this.context.clientId == this.context.hostId,
        name: client.name,
        code: this.context.code,
      });
    }
    Server.GetCategories()
      .then(categories => this.setState({ categories }))
      .catch(err => console.error(err));
  }

  componentDidUpdate() {
    if (this.qrCanvas.current && this.qrRendered !== this.context.code) {
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
            className={`${s.input} ${s.code}`}
            placeholder="code"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            maxLength={8}
            value={this.state.code}
            onChange={event => this.setState({ code: event.currentTarget.value })}
          />
          <button
            type="button"
            className={s.button}
            disabled={!this.state.code}
            onClick={() => this.setState({ stage: 'name', host: false })}>
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
          disabled={!this.state.name}
          onClick={() => {
            this.setState({ stage: 'code', code: '', name: '' });
            this.props.onConnect(true, this.state.name, this.state.code);
          }}>
          Join as painter
        </button>
        <button
          className={s.button}
          type="button"
          disabled={!this.state.name}
          onClick={() => {
            this.setState({ stage: 'code', code: '', name: '' });
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
          <select
            className={`${s.input}`}
            style={{ maxWidth: '16em' }}
            value={this.state.categoryId}
            onChange={event => this.setState({ categoryId: event.currentTarget.value })}>
            <option value="" disabled hidden>
              Choose a category
            </option>
            {Menu.option(this.state.categories)}
          </select>
          <div className={s.break} />
          <button
            className={s.button}
            type="button"
            disabled={!this.state.categoryId}
            onClick={() => this.props.onStart(this.state.categoryId)}>
            Start the game
          </button>
          <button className={s.button} type="button" onClick={this.props.onSettings}>
            Settings
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

  static option(categories: (Category | Group)[]) {
    return categories.map(category => {
      if (isGroup(category)) {
        return (
          <optgroup key={category.name} label={category.name}>
            {Menu.option(category.categories)}
          </optgroup>
        );
      }
      if (isCategory(category)) {
        return (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        );
      }
    });
  }
}
