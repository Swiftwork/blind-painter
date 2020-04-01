import React, { Component } from 'react';
import { SessionContext } from 'context/store';
import { Util } from 'client/util';
import { Client } from 'shared/interfaces';

import s from './Players.module.css';

/* Icons */
import PaletteIcon from 'assets/icons/palette.svg';
import HostIcon from 'assets/icons/host.svg';
import ClearIcon from 'assets/icons/clear.svg';
import PaletteOfflineIcon from 'assets/icons/palette-offline.svg';
import CriticIcon from 'assets/icons/critic.svg';

/* Sounds */
import YourTurnSound from 'assets/sounds/your-turn.mp3';
import LetsGoSound from 'assets/sounds/lets-go.mp3';
import UpNextSound from 'assets/sounds/up-next.mp3';
import ToTheStageSound from 'assets/sounds/to-the-stage.mp3';
import PickUpYourBrushSound from 'assets/sounds/pick-up-your-brush.mp3';
import ShowMeWhatYouGotSound from 'assets/sounds/show-me-what-you-got.mp3';

interface Props {}

interface State {
  reactions: Map<string, { reaction: string; showing: boolean }>;
}

export class Players extends Component<Props, State> {
  static contextType = SessionContext;
  declare context: React.ContextType<typeof SessionContext>;

  private turnId: string | undefined;
  private announcements: HTMLAudioElement[] = [];
  private nameTTS: Map<string, HTMLAudioElement> = new Map();

  constructor(props: Props) {
    super(props);
    this.state = {
      reactions: new Map(),
    };
  }

  componentDidMount() {
    this.announcements = [
      new Audio(YourTurnSound),
      new Audio(LetsGoSound),
      new Audio(UpNextSound),
      new Audio(ToTheStageSound),
      new Audio(PickUpYourBrushSound),
      new Audio(ShowMeWhatYouGotSound),
    ];
    this.announcements.forEach(audio => audio.load());
  }

  componentDidUpdate() {
    const reactions = this.state.reactions;
    this.context.clients.forEach(({ id, reaction, nameTTS }) => {
      if (this.state.reactions.get(id)?.reaction !== reaction) {
        reactions.set(id, { reaction, showing: true });
        this.setState({ reactions });
        setTimeout(() => {
          const reactionState = this.state.reactions.get(id);
          if (reactionState) {
            reactions.set(id, { ...reactionState, showing: false });
            this.setState({ reactions });
          }
        }, 1000);
      }

      if (!this.nameTTS.has(id)) {
        const audio = new Audio(nameTTS);
        audio.load();
        this.nameTTS.set(id, audio);
      }
    });

    if (this.turnId !== this.context.turnId) {
      this.turnId = this.context.turnId;
      this.newTurn();
    }
  }

  newTurn() {
    const tts = this.nameTTS.get(this.turnId || '');
    if (tts && this.context.hostId == this.context.clientId) {
      const announcement = Util.random(this.announcements);
      announcement.volume = this.context.soundVolume / 100;
      announcement.play();
      announcement.onended = () => {
        tts.volume = this.context.soundVolume / 100;
        tts.play();
      };
    }
  }

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
                    this.context.dispatch({ type: 'C2S_KICK', payload: { clientId: client.id } });
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
        <span className={s.reaction} aria-hidden={!this.state.reactions.get(client.id)?.showing}>
          {client.reaction}
        </span>
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
