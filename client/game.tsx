import React, { Component } from 'react';

import { SessionContext, Point, Client, Session, SessionDebug } from './api/session';
import { Server } from './api/server';
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

  componentDidUpdate(props: Props, state: State, context: React.ContextType<typeof SessionContext>) {
    console.log(context);
  }

  onConnect = (participate: boolean, name: string, code?: string) => {
    if (!code) {
      Server.NewSession().then(data => {
        Server.JoinSession(data.id, name, participate).then(this.onSession.bind(this, data.id));
      });
    } else {
      Server.JoinSession(code, name, participate).then(this.onSession.bind(this, code));
    }
  };

  onSession = (code: string, client: Client) => {
    this.socket = new Socket('/socket', this.context.socketSession, this.context.dispatch);
    this.context.dispatch({ type: 'session', payload: { code, clientId: client.id } });
  };

  private update(id: string | null, points: Point[] | undefined) {
    if (this.socket && !this.inThrottle) {
      this.socket.send({ type: 'update', detail: { id, points } });
      this.inThrottle = true;
      setTimeout(() => (this.inThrottle = false), 50);
    }
  }

  public render() {
    return (
      <>
        <SessionDebug session={this.context} />
        <Canvas />
        <Splash />
        <Players />
        <Controls />
        {!this.context.connected && <Menu onConnect={this.onConnect} />}
      </>
    );
  }
}
