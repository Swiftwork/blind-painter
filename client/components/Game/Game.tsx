import React, { Component } from 'react';

import { SessionContext, storeSession } from 'context/store';
import { Client, Stage } from 'context/interfaces';

import { Server, SessionClient } from 'api/server';
import { Socket } from 'api/socket';

import { Canvas } from 'components/Canvas/Canvas';
import { Actions } from 'components/Actions/Actions';
import { Splash } from 'components/Splash/Splash';
import { Players } from 'components/Players/Players';
import { Menu } from 'components/Menu/Menu';
import { Debug } from 'components/Debug/Debug';

import ThemeMusic from 'assets/sounds/theme.mp3';

interface Props {}

interface State {
  debug: boolean;
}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private music = new Audio(ThemeMusic);
  private socket: Socket | undefined;
  private sentCount = 0;
  private inThrottle = false;

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
    window.addEventListener('click', this.playAudio);
    if (this.context.code && this.context.clientId) {
      const client = this.context.clients.get(this.context.clientId);
      if (client) this.onSession({ code: this.context.code, client });
    }
  }

  playAudio = () => {
    this.music.play();
  };

  componentDidUpdate() {
    const client = this.context.clients.get(this.context.clientId);
    if (client) this.update(client);
    storeSession(this.context);
  }

  onConnect = (participate: boolean, name: string, code?: string) => {
    if (!code) {
      Server.NewSession(name, participate)
        .then(this.onSession)
        .catch(error => {
          alert(error);
        });
    } else {
      Server.JoinSession(code, name, participate)
        .then(this.onSession)
        .catch(error => {
          alert(error);
        });
    }
  };

  onSession = ({ code, client }: SessionClient) => {
    this.socket = new Socket(this.context.dispatch);
    this.socket.open('/socket', client.id);
    this.context.dispatch({ type: 'session', payload: { session: { code }, client } });
  };

  onStart = () => {
    this.socket?.send('start', {});
  };

  onQuit = () => {
    this.socket?.send('end', {});
    this.context.dispatch({ type: 'reset' });
  };

  private update(client: Client) {
    const sendPoints = () => {
      let points = client.itterations[this.context.currentRound - 1];
      if (!points) return;
      const length = points.length;
      points = points.slice(this.sentCount);
      if (!points.length) return;
      this.socket && this.socket.send('draw', { points });
      this.sentCount = length;
    };

    if (this.context.stage === 'started' && !this.inThrottle) {
      sendPoints();
      this.inThrottle = true;
      setTimeout(() => {
        sendPoints();
        this.inThrottle = false;
      }, 50);
    }
  }

  private allowedStage(...stages: Stage[]) {
    return stages.includes(this.context.stage);
  }

  public render() {
    return (
      <>
        {this.allowedStage('started', 'guessing', 'ended') && <Canvas />}
        {this.allowedStage('none', 'lobby') && <Splash />}
        {this.allowedStage('lobby', 'started', 'guessing', 'ended') && <Players />}
        {this.allowedStage('started', 'guessing') && <Actions />}
        {this.allowedStage('none', 'lobby') && (
          <Menu onConnect={this.onConnect} onStart={this.onStart} onQuit={this.onQuit} />
        )}
        {this.state.debug && <Debug />}
      </>
    );
  }
}
