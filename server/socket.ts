import { Server } from 'http';

import sockjs, { Server as SocketServer, Connection } from 'sockjs';

import { EventEmitter } from './emitter';
import { S2CAction, C2SAction, SocketPayload } from 'shared/actions';

export class Socket extends EventEmitter<'SESSION' | 'CONNECTION' | 'ACTION'> {
  private socket: SocketServer | undefined;
  private connections: { [socketSession: string]: Connection };

  constructor(server: Server) {
    super();

    this.socket = sockjs.createServer({
      prefix: '/socket',
    });
    this.connections = {};

    this.socket.on('connection', connection => {
      const socketSession = connection.url.split('/')[3];
      this.connections[socketSession] = connection;
      this.emit('SESSION', { socketSession });
      this.emit('CONNECTION', { socketSession, status: 'connected' });

      connection.on('close', () => {
        this.emit('CONNECTION', { socketSession, status: 'disconnected' });
        delete this.connections[socketSession];
      });

      connection.on('data', event => {
        const action: C2SAction & { payload: SocketPayload } = JSON.parse(event);
        this.emit('ACTION', { ...action, payload: { socketSession, ...action.payload } });
      });
    });

    this.socket.installHandlers(server);
  }

  getConnection(socketSession: string) {
    return this.connections[socketSession];
  }

  close(socketSessions: string | string[], code = 1000, reason = 'Manually closed') {
    const close = (socketSession: string) => {
      const connection = this.connections[socketSession];
      if (connection) connection.close(code.toString(), reason);
    };
    if (Array.isArray(socketSessions)) {
      for (const socketSession of socketSessions) close(socketSession);
    } else {
      close(socketSessions);
    }
  }

  broadcastTo(socketSessions: string | string[], action: S2CAction, exclude?: string[]) {
    const message = JSON.stringify(action);
    const send = (socketSession: string) => {
      const connection = this.connections[socketSession];
      if (connection) connection.write(message);
    };

    if (Array.isArray(socketSessions)) {
      for (const socketSession of socketSessions) {
        if (Array.isArray(exclude) && exclude.includes(socketSession)) continue;
        send(socketSession);
      }
    } else {
      send(socketSessions);
    }
  }

  broadcastAll(action: S2CAction, exclude?: string[]) {
    const message = JSON.stringify(action);
    for (const socketSession in this.connections) {
      if (Array.isArray(exclude) && exclude.includes(socketSession)) continue;
      const connection = this.connections[socketSession];
      if (connection) connection.write(message);
    }
  }
}
