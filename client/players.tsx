import React, { Component } from 'react';
import { SessionContext, Client } from './api/session';

import PaletteIcon from './assets/icons/palette.svg';

interface Props {
  session: Session;
}

export class Players extends Component<Props> {
  render() {
    return (
      <section style={{ position: 'absolute', display: 'flex', top: '0', left: '0', width: '100%' }}>
        {Array.from(this.props.session.clients).map(([_, client]) => Players.Player(client))}
      </section>
    );
  }

  static Player(client: Client) {
    return (
      <figure style={{ flex: '0 1 20%', textAlign: 'center' }}>
        <PaletteIcon fill={client.color} width={96} height={96} />
        <figcaption>${client.name}</figcaption>
      </figure>
    );
  }
}
