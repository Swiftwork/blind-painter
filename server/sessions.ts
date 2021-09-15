import { Util } from './util';
import { Stage, Client } from 'shared/interfaces';
import { Announcer } from './announcer';

export class Session {
  public code: string;
  public stage: Stage = 'lobby';
  public players = 7;
  public rounds = 2;
  public currentRound = 0;
  public elapsed = 0;
  public turnOrder: string[] = [];
  public turnId: string | undefined;
  public turnDuration = 1000 * 60;
  public turnElapsed = 0;
  public hostId: string | undefined;
  public blindId: string | undefined;
  public clients = new Map<string, Client>();
  public currentTurn = 0;
  public category: string | undefined;
  public subject: string | undefined;

  constructor(code: string) {
    this.code = code;
  }

  async newClient(name: string, participant = true) {
    if (participant && this.getIds(true).length >= this.players) return null;
    let id = Util.encode((Date.now() + 1) % (1000 * 60 * 60));
    id = `${this.code}-${id}`;
    const nameTTS = participant ? await Announcer.load(name) : undefined;
    const client: Client = {
      id,
      name,
      color: Util.getColor(this.clients.size),
      guess: undefined,
      nameTTS,
      participant,
      connected: false,
      reaction: '',
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
  getIds(participant?: boolean): string[] {
    return Array.from(this.clients, ([_, client]) => {
      if (typeof participant === 'boolean' && participant === client.participant) {
        return client.id;
      } else if (typeof participant === 'undefined') {
        return client.id;
      }
      return '';
    }).filter(id => !!id);
  }

  getGuesses() {
    const suspects: string[] = [];
    const guesses: string[] = [];
    const resolveName = (id: string) => this.clients.get(id)?.name;
    this.clients.forEach(client => {
      if (!client.guess) return;
      if (client.participant && client.id !== this.blindId) {
        const suspect = resolveName(client.guess);
        if (suspect) suspects.push(suspect);
        return;
      }
      guesses.push(client.guess);
    });
    return { suspects, guesses };
  }

  reset() {
    this.stage = 'lobby';
    this.currentRound = 0;
    this.elapsed = 0;
    this.turnOrder = [];
    this.turnId = undefined;
    this.turnElapsed = 0;
    this.blindId = undefined;
    this.currentTurn = 0;
    this.category = undefined;
    this.subject = undefined;
    this.clients.forEach(client => {
      client.iterations = [];
    });
  }

  static stripClients<K extends keyof Client>(clients: Map<string, Client>, exclude?: K[]) {
    return Array.from(clients.entries(), ([id, client]) => {
      const strippedClient = Array.isArray(exclude) && exclude.length ? Util.omit(client, exclude) : client;
      return [id, strippedClient];
    });
  }

  static serializePublic(session: Session, toJSON = true) {
    const strippedSession: any = Util.pick(session, [
      'code',
      'stage',
      'players',
      'rounds',
      'currentRound',
      'elapsed',
      'turnOrder',
      'turnId',
      'turnDuration',
      'turnElapsed',
      'hostId',
      'category',
      'clients',
    ]);
    strippedSession.clients = Session.stripClients(strippedSession.clients, ['guess']);
    return toJSON ? JSON.stringify(strippedSession) : strippedSession;
  }

  static serialize(session: Session, toJSON = true) {
    const strippedSession: any = { ...session };
    strippedSession.clients = Session.stripClients(strippedSession.clients);
    return toJSON ? JSON.stringify(strippedSession) : strippedSession;
  }

  static parse(session: string): Session {
    return Object.assign(
      new Session(''),
      JSON.parse(session, (key, value) => {
        if (key == 'clients') return new Map(value);
        return value;
      }),
    );
  }
}
