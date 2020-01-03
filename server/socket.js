const sockjs = require('sockjs');

module.exports.socket = server => {
  const socket = sockjs.createServer({
    prefix: '/socket',
  });
  const connections = {};

  const broadcast = (connection, data) => {
    data = typeof data !== 'string' ? JSON.stringify(data) : data;
    connection.write(data);
  };

  const broadcastAll = (data, exclude) => {
    data = typeof data !== 'string' ? JSON.stringify(data) : data;
    for (id in connections) {
      if (exclude && exclude.includes(id)) continue;
      connections[id].write(data);
    }
  };

  socket.on('connection', connection => {
    const id = connection.url.split('/')[3];
    connections[id] = connection;
    broadcast(connection, { type: 'setting', detail: { id } });

    connection.on('close', function() {
      delete connections[id];
    });

    connection.on('data', event => {
      broadcastAll(event, [id]);
    });
  });

  socket.installHandlers(server);

  return socket;
};
