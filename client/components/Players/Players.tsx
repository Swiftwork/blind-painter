import React, { Component } from 'react';
import { Client } from 'context/interfaces';
import { SessionContext } from 'context/store';
import { Util } from 'api/util';

import s from './Players.module.css';

import PaletteIcon from 'assets/icons/palette.svg';
import PaletteOfflineIcon from 'assets/icons/palette-offline.svg';
import CriticIcon from 'assets/icons/critic.svg';

interface Props {}

export class Players extends Component<Props> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  render() {
    const [painters, critics] = Util.partition(Array.from(this.context.clients.values()), client => client.participate);
    return (
      <section className={`${s.players}`}>
        {painters.map(client =>
          Players.Player(client, this.context.stage == 'lobby' || client.id === this.context.turnId),
        )}
        {Players.Critics(critics)}
      </section>
    );
  }

  static Player(client: Client, turn: boolean) {
    return (
      <figure key={client.id} className={`${s.player} ${!client.connected ? s.disconnected : ''}`} aria-current={turn}>
        {client.connected ? (
          <PaletteIcon className={s.icon} fill={client.color} />
        ) : (
          <PaletteOfflineIcon className={s.icon} fill={client.color} />
        )}
        <figcaption className={s.name}>
          <span className={s.turnHelper}>
            Your turn:
            <br />
          </span>
          {client.name}
        </figcaption>
      </figure>
    );
  }

  static Critics(clients: Client[]) {
    return (
      <figure className={s.critics}>
        <CriticIcon className={s.icon} />
        <figcaption className={s.name}>{clients.length} x critics</figcaption>
      </figure>
    );
  }
}
