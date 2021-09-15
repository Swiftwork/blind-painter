import { Server } from 'http';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import sockjs, { Server as SocketServer, Connection } from 'sockjs';

import { EventEmitter } from './emitter';
import { S2CAction, C2SAction, SocketPayload } from 'shared/actions';
import { Session } from './sessions';
import { Redis } from './redis';

export class Socket extends EventEmitter<'CONNECTION' | 'CLIENT_ACTION' | 'SERVER_ACTION'> {
  static RateLimit = 30;

  private socket: SocketServer;
  private connections: { [socketSession: string]: Connection };
  private rateLimiter = new RateLimiterMemory({
    points: Socket.RateLimit,
  });

  constructor(private server: Server, private redis: Redis) {
    super();

    this.socket = sockjs.createServer({
      prefix: '/socket',
    });
    this.connections = {};

    this.redis.subscribe((channel, action) => {
      console.debug('sub', action.type);
      this.emit(channel, action);
    });

    this.socket.on('connection', connection => {
      const socketSession = connection.url.split('/')[3];
      this.connections[socketSession] = connection;
      this.emit('CONNECTION', { socketSession, status: 'connected' });
      this.redis.publishConnection({ socketSession, status: 'connected' });

      connection.on('close', () => {
        this.emit('CONNECTION', { socketSession, status: 'disconnected' });
        this.redis.publishConnection({ socketSession, status: 'disconnected' });
        delete this.connections[socketSession];
      });

      connection.on('data', async event => {
        try {
          await this.rateLimiter.consume(socketSession);
          const action: C2SAction & { payload: SocketPayload } = JSON.parse(event);
          action.payload.socketSession = socketSession;
          this.emit('CLIENT_ACTION', action);
          this.redis.publishClientAction(action);
        } catch (err) {
          console.warn(`Socket session ${socketSession} exceeded rate limit of ${Socket.RateLimit}/second`);
          this.close(socketSession, 4000, 'Rate limit exceeded');
        }
      });
    });

    this.socket.installHandlers(this.server);
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
    const message = JSON.stringify(action, (key, value) => {
      if (key == 'session') return Session.serializePublic(value, false);
      return value;
    });
    const send = (socketSession: string) => {
      const connection = this.connections[socketSession];
      this.redis.publishServerAction(action);
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
    const message = JSON.stringify(action, (key, value) => {
      if (key == 'session') return Session.serializePublic(value, false);
      return value;
    });
    for (const socketSession in this.connections) {
      if (Array.isArray(exclude) && exclude.includes(socketSession)) continue;
      const connection = this.connections[socketSession];
      if (connection) connection.write(message);
    }
  }
}
