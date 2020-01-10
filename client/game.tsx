import React, { Component } from 'react';

import { SessionContext, session, Client, Point } from './api/session';
import { Server } from './api/server';
import { Socket } from './api/socket';
import { Canvas } from './canvas';
import { Controls } from './controls';
import { Splash } from './splash';
import { Players } from './players';
import { Menu } from './menu';

interface Props {}

interface State {
  connected: boolean;
  painter: boolean;
  clients: Map<string, Client>;
  updateClient(id: string | null, points: Point | Point[]): Point[] | undefined;
  id: string | null;
}

export class Game extends Component<Props, State> {
  static contextType = SessionContext;

  private socket: Socket | undefined;

  constructor(props: Props) {
    super(props);

    this.state = {
      ...session,
    };
  }

  componentDidMount() {}

  onVenue = (host: boolean, code?: string) => {
    Server.NewSession(host, code).then((data: { id: string }) => {
      console.log(data);
    });
    /*
    this.socket = new Socket('/socket', this.state.id);
    this.socket.on('update', details => {
      console.log('update');
    });
    */
  };

  onParticipate = (painter: boolean) => {};

  public render() {
    return (
      <SessionContext.Provider value={this.state}>
        <Canvas />
        <Splash />
        <Players />
        <Controls />
        <Menu onVenue={this.onVenue} onParticipate={this.onParticipate} />
      </SessionContext.Provider>
    );
  }
}
