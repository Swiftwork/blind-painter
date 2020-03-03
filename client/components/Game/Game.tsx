import React, { Component } from 'react';

import { SessionContext, storeSession } from 'context/store';
import { Stage } from 'context/interfaces';

import { Server, SessionClient } from 'api/server';
import { Util } from 'api/util';

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

interface Props {}

interface State {
  debug: boolean;
}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private music = new Audio(ThemeMusic);

  constructor(props: Props) {
    super(props);
    const urlParams = new URLSearchParams(window.location.search);

    this.music.load();
    this.music.volume = 0.5;
    this.music.loop = true;

    this.state = {
      debug: urlParams.get('debug') == 'true',
    };
  }

  componentDidMount() {
    window.addEventListener('click', this.playTheme);

    if (this.context.code && this.context.clientId) {
      const client = this.context.clients.get(this.context.clientId);
      if (client) this.onSession({ code: this.context.code, client });
    }
  }

  playTheme = () => {
    if (this.context.hostId == this.context.clientId) this.music.play();
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
    this.context.dispatch({ type: 'RECEIVE_SESSION', payload: { session: { code }, client } });
  };

  onStart = () => {
    this.context.dispatch({ type: 'START' });
  };

  onQuit = () => {
    this.context.dispatch({ type: 'END' });
    this.context.dispatch({ type: 'RESET' });
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
