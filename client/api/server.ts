import { Client } from './session';

export class Server {
  static NewSession(): Promise<{ id: string }> {
    return fetch(`/sessions`, {
      method: 'POST',
    }).then(res => res.json());
  }

  static JoinSession(code: string, name: string, participate: boolean): Promise<Client> {
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
