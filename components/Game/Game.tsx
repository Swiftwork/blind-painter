import React, { Component } from 'react';

import { SessionContext, storeSession } from 'context/store';

import { Server, SessionClient } from 'client/server';

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

import ThemeMusic from 'assets/sounds/theme.mp3';
import { Stage } from 'shared/interfaces';

interface Props {}

interface State {
  debug: boolean;
}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private music: HTMLAudioElement | undefined;

  constructor(props: Props) {
    super(props);

    this.state = {
      debug: false,
    };
  }

  componentDidMount() {
    window.addEventListener('click', this.playTheme);

    this.music = new Audio(ThemeMusic);
    this.music.load();
    this.music.volume = 0.5;
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

    // TODO: refactor
    storeSession(this.context);
  }

  onConnect = (participant: boolean, name: string, code?: string) => {
    if (!code) {
      Server.NewSession(name, participant)
        .then(this.onSession)
        .catch(error => {
          alert(error);
        });
    } else {
      Server.JoinSession(code, name, participant)
        .then(this.onSession)
        .catch(error => {
          alert(error);
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

  onQuit = () => {
    this.context.dispatch({ type: 'C2S_END' });
    this.context.dispatch({ type: 'C2S_RESET' });
  };

  private allowedStage(...stages: (Stage | 'all')[]) {
    return stages.includes('all') || stages.includes(this.context.stage);
  }

  public render() {
    return (
      <>
        {this.allowedStage('started', 'guessing') && <Canvas />}
        {this.allowedStage('none', 'lobby') && <Splash />}
        {this.allowedStage('lobby', 'started', 'guessing', 'ended') && <Players />}
        {this.allowedStage('none', 'lobby') && (
          <Menu onConnect={this.onConnect} onStart={this.onStart} onQuit={this.onQuit} />
        )}
        {this.allowedStage('started') && <Actions />}
        {this.allowedStage('started', 'guessing') && <Timer />}
        {this.allowedStage('started') && <Subject />}
        {this.allowedStage('guessing') && <Guess />}
        {this.allowedStage('ended') && <Reveal />}
        {this.state.debug && <Debug />}
      </>
    );
  }
}
