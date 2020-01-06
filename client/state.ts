export interface Point {
  x: number;
  y: number;
}

export interface Client {
  name: string;
  color: string;
  first: Point[];
  second: Point[];
}

export class State {
  connected = false;
  clients: Map<string, Client> = new Map();

  updateClient(id = this.id, points: Point | Point[]) {
    if (!id) return;

    const client: Client = this.clients.get(id) || {
      name: id,
      color: State.intToRGB(State.hashCode(id)),
      first: [],
      second: [],
    };

    if (Array.isArray(points)) client.first = points;
    else client.first.push(points);

    this.clients.set(id, client);
    return client.first;
  }

  get id(): string | null {
    return sessionStorage.getItem('sessionId');
  }

  set id(id: string | null) {
    if (!id) sessionStorage.removeItem('sessionId');
    else sessionStorage.setItem('sessionId', id);
  }

  static hashCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  static intToRGB(i: number) {
    const c = (i & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }
}
