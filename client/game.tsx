import React, { Component } from 'react';

import { SessionContext, Point, Client, Session, SessionDebug } from './api/session';
import { Server, SessionClient } from './api/server';
import { Socket } from './api/socket';
import { Canvas } from './canvas';
import { Controls } from './controls';
import { Splash } from './splash';
import { Players } from './players';
import { Menu } from './menu';

interface Props {}

interface State {}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private socket: Socket | undefined;
  inThrottle = false;

  constructor(props: Props) {
    super(props);

    this.state = {};
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
    const socketSession = `${code}-${client.id}`;
    this.socket = new Socket('/socket', socketSession, this.context.dispatch);
    this.context.dispatch({ type: 'session', payload: { code, clientId: client.id } });
  };

  private update(client: Client) {
    if (this.socket && this.context.connected && !this.inThrottle) {
      this.socket.send({
        type: 'update',
        detail: { id: client.id, points: client.itterations[this.context.currentRound - 1] },
      });
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
        <Controls />
        {!this.context.connected && <Menu onConnect={this.onConnect} />}
        <SessionDebug session={this.context} />
      </>
    );
  }
}
