import React, { Component } from 'react';

import { Socket } from './api/socket';
import { Canvas } from './canvas';
import { Actions } from './api/actions';
import { Session } from './api/session';
import { Controls } from './controls';
import { Splash } from './splash';
import { Players } from './players';
import { Menu } from './menu';

interface Props {}

interface State {
  session: Session;
}

export class Game extends Component<Props, State> {
  private socket: Socket;

  constructor(props: Props) {
    super(props);

    const session = new Session();
    this.socket = new Socket('/socket', session.id);

    this.state = {
      session,
    };
  }

  componentDidMount() {
    //const actions = new Actions(this.$canvas.current, session);
    this.socket.on('update', details => {
      console.log('update');
    });
  }

  public render() {
    return (
      <div>
        <Canvas clients={this.state.session.clients} />
        <Splash />
        <Players session={this.state.session} />
        <Controls />
        <Menu />
      </div>
    );
  }
}
