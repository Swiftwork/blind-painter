const sockjs = require('sockjs');

const { EventEmitter } = require('./emitter');

class Socket extends EventEmitter {
  constructor(server) {
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
        const { type, detail } = JSON.parse(event);
        this.emit(type, { socketSession, ...detail });
      });
    });

    this.socket.installHandlers(server);
  }

  getConnection(socketSession) {
    return this.connections[socketSession];
  }

  close(socketSessions, code = 410, reason = 'Cleanup') {
    const close = socketSession => {
      const connection = this.connections[socketSession];
      if (connection) connection.close(code, reason);
    };
    if (Array.isArray(socketSessions)) {
      for (const socketSession of socketSessions) close(socketSession);
    } else {
      close(socketSessions);
    }
  }

  broadcastTo(socketSessions, type, detail, exclude) {
    const payload = JSON.stringify({ type, detail });
    const send = socketSession => {
      const connection = this.connections[socketSession];
      if (connection) connection.write(payload);
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

  broadcastAll(type, detail, exclude) {
    const payload = JSON.stringify({ type, detail });
    for (const socketSession in this.connections) {
      if (Array.isArray(exclude) && exclude.includes(socketSession)) continue;
      const connection = this.connections[socketSession];
      if (connection) connection.write(payload);
    }
  }
}

module.exports = {
  Socket,
};
