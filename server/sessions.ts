import { Util } from './util';

export const sessions = new Map();

export class Session {
  private code: string;
  private stage = 'lobby';
  private rounds = 2;
  private currentRound = 0;
  private elapsed = 0;
  private turnOrder = [];
  private turnId: string | undefined;
  private turnDuration = 1000 * 60;
  private turnElapsed = 0;
  private hostId: string | undefined;
  private blindId: string | undefined;
  private clients = new Map();

  public currentTurn = 0;
  public subject: string | undefined;

  constructor(code: string) {
    this.code = code;
  }

  newClient(name: string, participant = true) {
    let id = Util.encode((Date.now() + 1) % (1000 * 60 * 60));
    id = `${this.code}-${id}`;
    const client = {
      id,
      name,
      color: Util.getColor(this.clients.size),
      guess: undefined,
      participant,
      connected: false,
      iterations: [],
    };
    if (!this.clients.size) this.hostId = id;
    this.clients.set(id, client);
    return client;
  }

  getClient(id: string) {
    return this.clients.get(id);
  }

  deleteClient(id: string) {
    return this.clients.delete(id);
  }

  /** Get a list of client ids
   * @param {boolean} [participant] filter list. if omitted get all
   * @returns {string[]} list of client ids
   */
  getIds(participant?: boolean) {
    return Array.from(this.clients, ([_, client]) => {
      if (typeof participant === 'boolean' && participant === client.participant) {
        return client.id;
      } else if (typeof participant === 'undefined') {
        return client.id;
      }
      return undefined;
    }).filter(id => !!id);
  }

  getGuesses() {
    const suspects: string[] = [];
    const guesses: string[] = [];
    const resolveName = (id: string) => this.clients.get(id).name;
    this.clients.forEach(client => {
      if (!client.guess) return;
      if (client.participant && client.id !== this.blindId) return suspects.push(resolveName(client.guess));
      guesses.push(client.guess);
    });
    return { suspects, guesses };
  }

  toJSON() {
    return {
      code: this.code,
      stage: this.stage,
      rounds: this.rounds,
      currentRound: this.currentRound,
      elapsed: this.elapsed,
      turnOrder: this.turnOrder,
      turnId: this.turnId,
      turnDuration: this.turnDuration,
      turnElapsed: this.turnElapsed,
      hostId: this.hostId,
      clients: Array.from(this.clients.entries(), ([id, client]) => {
        const { guess, ...strippedClient } = client;
        return [id, strippedClient];
      }),
    };
  }
}
