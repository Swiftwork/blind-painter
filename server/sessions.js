const express = require('express');
const Hashids = require('hashids/cjs');

const router = express.Router();
const hashids = new Hashids('', 5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

module.exports.sessions = new Map();

class Session {
  constructor(id) {
    this.clients = new Map();
    this.id = id;
    this.rounds = 2;
  }

  newClient(name) {
    const id = hashids.encode(this.clients.size);
    const client = {
      id: id,
      name: name,
      color: '#000',
      interations: [],
    };
    this.clients.set(id, client);
    return client;
  }

  deleteClient(id) {
    return this.clients.delete(id);
  }
}

router.post('/', function(req, res) {
  //const date = Date.now();
  const date = new Date('2010-01-01T20:00:00');
  const sessionId = hashids.encode(date % (1000 * 60 * 60));
  module.exports.sessions.set(sessionId, new Session(sessionId));
  res.send({ sessionId });
});

router.put('/:id', function(req, res) {
  const session = module.exports.sessions.get(req.params.id);
  if (!session) return res.status(404).send(`Session ${req.params.id} does not exist`);
  if (!req.body.name) return res.status(400).send(`You must supply a name in request body`);
  const client = session.newClient(req.body.name);
  res.send(client);
});

router.delete('/:id/:client', function(req, res) {
  const session = module.exports.sessions.get(req.params.id);
  if (!session) return res.status(404).send(`Session ${req.params.id} does not exist`);
  if (session.deleteClient(req.params.client)) {
    res.send(`Removed user ${req.params.client} from session ${req.params.id}`);
  } else {
    res.status(404).send(`User ${req.params.client} does not exist`);
  }
});

module.exports.endpoint = router;
