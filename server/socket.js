const sockjs = require('sockjs');
const { sessions } = require('./sessions');

module.exports.socket = server => {
  const socket = sockjs.createServer({
    prefix: '/socket',
  });
  const connections = {};

  const broadcast = (connection, type, detail) => {
    const payload = JSON.stringify({ type, detail });
    connection.write(payload);
  };

  const broadcastTo = (type, detail, include, exclude) => {
    const payload = JSON.stringify({ type, detail });
    for (const id of include) {
      if (Array.isArray(exclude) && exclude.includes(id)) continue;
      connections[id].write(payload);
    }
  };

  const broadcastAll = (type, detail, exclude) => {
    const payload = JSON.stringify({ type, detail });
    for (const id in connections) {
      if (Array.isArray(exclude) && exclude.includes(id)) continue;
      connections[id].write(payload);
    }
  };

  socket.on('connection', connection => {
    const socketSession = connection.url.split('/')[3];
    connections[socketSession] = connection;
    const [code, clientId] = socketSession.split('-');
    const session = sessions.get(code);
    broadcast(connection, 'session', session);

    connection.on('close', function() {
      delete connections[socketSession];
    });

    connection.on('data', event => {
      const { type, detail } = JSON.parse(event);
      switch (type) {
        case 'update':
          broadcastTo('update', detail, session.getSocketSessions(), [socketSession]);
          break;
      }
    });
  });

  socket.installHandlers(server);

  return socket;
};
