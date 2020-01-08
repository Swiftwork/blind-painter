import React, { Component } from 'react';

import { Socket } from './api/socket';
import { Canvas } from './canvas';
import { Actions } from './api/actions';
import { SessionContext, session, Client, Point } from './api/session';
import { Controls } from './controls';
import { Splash } from './splash';
import { Players } from './players';
import { Menu } from './menu';

interface Props {}

interface State {
  connected: boolean;
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

  componentDidMount() {
    //const actions = new Actions(this.$canvas.current, session);
    this.socket = new Socket('/socket', this.state.id);
    this.socket.on('update', details => {
      console.log('update');
    });
  }

  public render() {
    return (
      <SessionContext.Provider value={this.state}>
        <Canvas />
        <Splash />
        <Players />
        <Controls />
        <Menu />
      </SessionContext.Provider>
    );
  }
}
