import { Client } from './session';

export interface SessionClient {
  code: string;
  client: Client;
}

export class Server {
  static NewSession(name: string, participate: boolean): Promise<SessionClient> {
    return fetch(`/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        participate,
      }),
    }).then(res => res.json());
  }

  static JoinSession(code: string, name: string, participate: boolean): Promise<SessionClient> {
    return fetch(`/sessions/${code}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        participate,
      }),
    }).then(res => res.json());
  }
}
