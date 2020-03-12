import React, { Component } from 'react';
import { Client } from 'context/interfaces';
import { SessionContext } from 'context/store';
import { Util } from 'client/util';

import s from './Players.module.css';

import PaletteIcon from 'assets/icons/palette.svg';
import HostIcon from 'assets/icons/host.svg';
import ClearIcon from 'assets/icons/clear.svg';
import PaletteOfflineIcon from 'assets/icons/palette-offline.svg';
import CriticIcon from 'assets/icons/critic.svg';

interface Props {}

export class Players extends Component<Props> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  render() {
    const [painters, critics] = Util.partition(Array.from(this.context.clients.values()), client => client.participant);
    return (
      <section
        className={`${s.players}`}
        style={{
          pointerEvents: this.context.stage !== 'lobby' ? 'none' : 'all',
        }}>
        {painters.map(client =>
          this.renderPlayer(
            client,
            this.context.hostId === client.id,
            this.context.stage === 'lobby' || client.id === this.context.turnId,
            this.context.clientId === client.id,
          ),
        )}
        {this.renderCritics(critics)}
      </section>
    );
  }

  renderPlayer(client: Client, host: boolean, turn: boolean, you: boolean) {
    return (
      <figure key={client.id} className={`${s.player} ${!client.connected ? s.disconnected : ''}`} aria-current={turn}>
        {this.context.stage === 'lobby' &&
          (host ? (
            <HostIcon className={s.helper} fill={client.color} />
          ) : (
            this.context.clientId === this.context.hostId && (
              <ClearIcon
                className={s.helper}
                fill={client.color}
                style={{
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (this.context.clientId === this.context.hostId)
                    this.context.dispatch({ type: 'KICK', payload: { clientId: client.id } });
                }}
              />
            )
          ))}
        {client.connected ? (
          <PaletteIcon className={s.icon} fill={client.color} />
        ) : (
          <PaletteOfflineIcon className={s.icon} fill={client.color} />
        )}
        <figcaption className={s.name}>
          <span className={s.turnHelper}>
            {you ? 'Your' : `Player's`} turn:
            <br />
          </span>
          {client.name}
        </figcaption>
      </figure>
    );
  }

  renderCritics(clients: Client[]) {
    return (
      <figure className={s.critics}>
        <CriticIcon className={s.icon} />
        <figcaption className={s.name}>{clients.length} x critics</figcaption>
      </figure>
    );
  }
}
