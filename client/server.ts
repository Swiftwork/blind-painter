import { Category, Group, Client } from 'shared/interfaces';

export interface SessionClient {
  code: string;
  client: Client;
}

export class Server {
  static NewSession(name: string, participant: boolean): Promise<SessionClient> {
    return fetch(`/api/sessions`, {
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
    return fetch(`/api/sessions/${code}`, {
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

  static GetCategories(): Promise<(Category | Group)[]> {
    return fetch(`/api/words`)
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res;
      })
      .then(res => res.json());
  }
}
