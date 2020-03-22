import React, { Component, createRef } from 'react';

import { SessionContext, storeSession } from 'context/store';
import { Server, SessionClient } from 'client/server';
import { Stage } from 'shared/interfaces';

import { Canvas } from 'components/Canvas/Canvas';
import { Actions } from 'components/Actions/Actions';
import { Splash } from 'components/Splash/Splash';
import { Players } from 'components/Players/Players';
import { Menu } from 'components/Menu/Menu';
import { Guess } from 'components/Guess/Guess';
import { Debug } from 'components/Debug/Debug';
import { Subject } from 'components/Subject/Subject';
import { Reveal } from 'components/Reveal/Reveal';
import { Timer } from 'components/Timer/Timer';
import { Toast } from 'components/Toast/Toast';
import { Settings, SettingsState } from 'components/Settings/Settings';

import ThemeMusic from 'assets/sounds/theme.mp3';
import s from './Game.module.css';

interface Props {}

interface State {
  debug: boolean;
  errors: string[];
}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private music: HTMLAudioElement | undefined;
  private settingsRef = createRef<Settings>();

  constructor(props: Props) {
    super(props);

    this.state = {
      debug: false,
      errors: [],
    };
  }

  componentDidMount() {
    window.addEventListener('click', this.playTheme);

    this.music = new Audio(ThemeMusic);
    this.music.load();
    this.music.volume = this.context.musicVolume / 100;
    this.music.loop = true;

    const urlParams = new URLSearchParams(window.location.search);

    this.setState({
      debug: urlParams.get('debug') == 'true',
    });

    if (this.context.code && this.context.clientId) {
      const client = this.context.clients.get(this.context.clientId);
      if (client) this.onSession({ code: this.context.code, client });
    }
  }

  playTheme = () => {
    if (this.context.hostId == this.context.clientId && this.music) {
      this.music.play().catch(() => {});
    }
  };

  componentDidUpdate() {
    if (this.context.stage === 'lobby' && this.context.hostId === this.context.clientId) this.playTheme();
    if (this.music) this.music.volume = this.context.musicVolume / 100;
    // TODO: refactor
    storeSession(this.context);
  }

  onConnect = (participant: boolean, name: string, code?: string) => {
    if (!code) {
      Server.NewSession(name, participant)
        .then(this.onSession)
        .catch(error => {
          this.setState({ errors: [...this.state.errors, error.message] });
        });
    } else {
      Server.JoinSession(code, name, participant)
        .then(this.onSession)
        .catch(error => {
          console.dir(error);
          this.setState({ errors: [...this.state.errors, error.message] });
        });
    }
  };

  onSession = ({ code, client }: SessionClient) => {
    this.playTheme();
    this.context.dispatch({ type: 'S2C_SESSION', payload: { session: { code }, client } });
  };

  onStart = (categoryId: string) => {
    this.context.dispatch({ type: 'C2S_START', payload: { categoryId } });
  };

  onSettingsToggle = () => {
    this.settingsRef.current && this.settingsRef.current.show();
  };

  onSettings = (state: SettingsState) => {
    const { musicVolume, soundVolume, players, rounds, turnDuration } = state;
    this.context.dispatch({ type: 'C2S_SETTINGS', payload: { musicVolume, soundVolume } });
    this.context.dispatch({ type: 'C2S_SESSION', payload: { players, rounds, turnDuration } });
  };

  onQuit = () => {
    this.context.dispatch({ type: 'C2S_END' });
  };

  onClearError = (index: number) => {
    this.setState({ errors: this.state.errors.filter((_, i) => index !== i) });
  };

  private allowedStage(...stages: (Stage | 'all')[]) {
    return stages.includes('all') || stages.includes(this.context.stage);
  }

  public render() {
    return (
      <>
        {this.allowedStage('started', 'guessing') && <Canvas />}
        {this.allowedStage('none', 'lobby') && <Splash />}
        {this.allowedStage('lobby', 'started', 'guessing', 'reveal') && <Players />}
        {this.allowedStage('none', 'lobby') && (
          <Menu
            onConnect={this.onConnect}
            onStart={this.onStart}
            onSettings={this.onSettingsToggle}
            onQuit={this.onQuit}
          />
        )}
        {this.allowedStage('started') && <Actions />}
        {this.allowedStage('started', 'guessing') && <Timer />}
        {this.allowedStage('started') && <Subject />}
        {this.allowedStage('guessing') && <Guess />}
        {this.allowedStage('reveal') && <Reveal />}
        {this.allowedStage('lobby', 'started', 'guessing', 'reveal') && (
          <Settings ref={this.settingsRef} onChange={this.onSettings} />
        )}
        <div className={s.toasts}>
          {this.state.errors.map((error, i) => (
            <Toast key={error} onClear={() => this.onClearError(i)}>
              {error}
            </Toast>
          ))}
        </div>
        {this.state.debug && <Debug />}
      </>
    );
  }
}
