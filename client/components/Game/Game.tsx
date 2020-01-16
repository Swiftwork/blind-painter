import React, { Component } from 'react';

import { SessionContext, Client } from 'api/session';
import { Server, SessionClient } from 'api/server';
import { Socket } from 'api/socket';
import { Canvas } from 'components/Canvas/Canvas';
import { Actions } from 'components/Actions/Actions';
import { Splash } from 'components/Splash/Splash';
import { Players } from 'components/Players/Players';
import { Menu } from 'components/Menu/Menu';
import { Debug } from 'components/Debug/Debug';

interface Props {}

interface State {}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private socket: Socket | undefined;
  inThrottle = false;

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    if (this.context.code && this.context.clientId) {
      const client = this.context.clients.get(this.context.clientId);
      if (client) this.onSession({ code: this.context.code, client });
    }
  }

  componentDidUpdate() {
    const client = this.context.clients.get(this.context.clientId);
    if (client) this.update(client);
  }

  onConnect = (participate: boolean, name: string, code?: string) => {
    if (!code) {
      Server.NewSession(name, participate).then(this.onSession);
    } else {
      Server.JoinSession(code, name, participate).then(this.onSession);
    }
  };

  onSession = ({ code, client }: SessionClient) => {
    this.socket = new Socket(this.context.dispatch);
    this.socket.open('/socket', client.id);
    this.context.dispatch({ type: 'session', payload: { session: { code }, client } });
  };

  onStart = () => {
    this.socket?.send('start', { code: this.context.code });
  };

  private update(client: Client) {
    sessionStorage.setItem(
      'session',
      JSON.stringify(this.context, (key, value) => {
        if (key == 'connected') return undefined;
        if (key == 'status') return undefined;
        if (key == 'clients') return Array.from(value.entries());
        return value;
      }),
    );

    if (this.socket && this.context.status === 'started' && !this.inThrottle) {
      this.socket.send('draw', { points: client.itterations[this.context.currentRound - 1] });
      this.inThrottle = true;
      setTimeout(() => (this.inThrottle = false), 50);
    }
  }

  public render() {
    return (
      <>
        <Canvas />
        <Splash />
        <Players />
        <Actions />
        <Menu onConnect={this.onConnect} onStart={this.onStart} />
        <Debug />
      </>
    );
  }
}
