import React, { Component } from 'react';
import { SessionContext, Client } from 'api/session';

import s from './Players.module.css';

import PaletteIcon from 'assets/icons/palette.svg';

interface Props {}

export class Players extends Component<Props> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  render() {
    return (
      <section className={s.players}>
        {Array.from(this.context.clients).map(([_, client]) => Players.Player(client))}
      </section>
    );
  }

  static Player(client: Client) {
    return (
      <figure className={s.player} key={client.id}>
        <PaletteIcon fill={client.color} width={96} height={96} />
        <figcaption>{client.name}</figcaption>
      </figure>
    );
  }
}
