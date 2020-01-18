import { Client } from 'context/interfaces';

export interface SessionClient {
  code: string;
  client: Client;
}

export class Server {
  static NewSession(name: string, participant: boolean): Promise<SessionClient> {
    return fetch(`/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        participant,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res;
      })
      .then(res => res.json());
  }

  static JoinSession(code: string, name: string, participant: boolean): Promise<SessionClient> {
    return fetch(`/sessions/${code}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        participant,
      }),
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res;
      })
      .then(res => res.json());
  }
}
