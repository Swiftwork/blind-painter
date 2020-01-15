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
      this.emit('session', { socketSession });

      connection.on('close', () => {
        delete this.connections[socketSession];
      });

      connection.on('data', event => {
        const { type, detail } = JSON.parse(event);
        console.log(type, detail);
        this.emit(type, { socketSession, ...detail });
      });
    });

    this.socket.installHandlers(server);
  }

  broadcastTo(include, type, detail, exclude) {
    const payload = JSON.stringify({ type, detail });
    if (Array.isArray(include)) {
      for (const socketSession of include) {
        if (Array.isArray(exclude) && exclude.includes(socketSession)) continue;
        const connection = this.connections[socketSession];
        if (connection) connection.write(payload);
      }
    } else {
      const connection = this.connections[include];
      if (connection) connection.write(payload);
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
