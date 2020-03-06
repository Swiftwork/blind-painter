import { Client } from 'context/interfaces';

export interface SessionClient {
  code: string;
  client: Client;
}

export interface Category {
  id: string;
  name: string;
}

export function isCategory(category: any): category is Category {
  return 'id' in category;
}

export interface Group {
  name: string;
  categories: (Category | Group)[];
}

export function isGroup(group: any): group is Group {
  return 'categories' in group;
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

  static GetCategories(): Promise<(Category | Group)[]> {
    return fetch(`/words/`, {})
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res;
      })
      .then(res => res.json());
  }
}
