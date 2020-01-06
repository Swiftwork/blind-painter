import { State, Client } from './state';
import { Util } from './util';

import paletteIcon from './assets/icons/palette.svg';

export class Players {
  private state: State;
  private $players: HTMLElement;

  constructor(state: State) {
    this.state = state;
    this.$players = document.createElement('section');
    this.$players.style.position = 'absolute';
    this.$players.style.display = 'flex';
    this.$players.style.top = '0';
    this.$players.style.left = '0';
    this.$players.style.width = '100%';
    document.body.appendChild(this.$players);
    this.update();
  }

  update() {
    while (this.$players.firstChild) {
      this.$players.removeChild(this.$players.firstChild);
    }
    this.state.clients.forEach(client => {
      this.$players.appendChild(Players.Player(client));
    });
  }

  static Player(client: Client) {
    const player = document.createElement('figure');
    player.style.flex = '0 1 20%';
    player.style.textAlign = 'center';
    const icon = Util.Icon(paletteIcon.id, 96);
    icon.style.fill = client.color;
    player.appendChild(icon);
    const name = document.createElement('figcaption');
    name.textContent = client.name;
    player.appendChild(name);
    return player;
  }
}
