import { Server } from 'http';
import { RateLimiterMemory } from 'rate-limiter-flexible';

import sockjs, { Server as SocketServer, Connection } from 'sockjs';

import { EventEmitter } from './emitter';
import { S2CAction, C2SAction, SocketPayload } from 'shared/actions';

export class Socket extends EventEmitter<'SESSION' | 'CONNECTION' | 'ACTION'> {
  static RateLimit = 30;

  private socket: SocketServer | undefined;
  private connections: { [socketSession: string]: Connection };
  private rateLimiter = new RateLimiterMemory({
    points: Socket.RateLimit,
  });

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

      connection.on('data', async event => {
        try {
          await this.rateLimiter.consume(socketSession);
          const action: C2SAction & { payload: SocketPayload } = JSON.parse(event);
          this.emit('ACTION', { ...action, payload: { socketSession, ...action.payload } });
        } catch (err) {
          console.warn(`Socket session ${socketSession} exceeded rate limit of ${Socket.RateLimit}/second`);
          this.close(socketSession, 4000, 'Rate limit exceeded');
        }
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
