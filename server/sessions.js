const express = require('express');
const Hashids = require('hashids/cjs');

const router = express.Router();
const hashids = new Hashids('', 5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

module.exports.sessions = new Map();

class Session {
  constructor(code) {
    this.code = code;
    this.rounds = 2;
    this.currentRound = 1;
    this.time = 1000 * 60;
    this.currentTime = 0;
    this.clients = new Map();
  }

  newClient(name) {
    const id = hashids.encode(this.clients.size);
    const client = {
      id,
      name,
      color: '#000',
      itterations: [],
    };
    if (!this.clients.size) this.host = id;
    this.clients.set(id, client);
    return client;
  }

  deleteClient(id) {
    return this.clients.delete(id);
  }

  getSocketSessions() {
    return Array.from(this.clients, ([_, client]) => `${this.code}-${client.id}`);
  }

  toJSON() {
    return {
      code: this.code,
      rounds: this.rounds,
      currentRound: this.currentRound,
      time: this.time,
      currentTime: this.currentTime,
      host: this.host,
      clients: Array.from(this.clients.entries()),
    };
  }
}

/** Fetches or creates a new session based on code
 * @param {string} [code] code identifying the session
 */
function getSession(code) {
  let session;
  if (typeof code === 'string') {
    session = module.exports.sessions.get(code);
  } else {
    const date = Date.now();
    code = hashids.encode(date % (1000 * 60 * 60));
    module.exports.sessions.set(code, (session = new Session(code)));
  }
  return { code, session };
}

router.post('/', function(req, res) {
  if (!req.body.name) return res.status(400).send(`You must supply a name in request body`);
  const { code, session } = getSession();
  const client = session.newClient(req.body.name);
  res.send({ code, client });
});

router.put('/:code', function(req, res) {
  if (!req.body.name) return res.status(400).send(`You must supply a name in request body`);
  const { code, session } = getSession(req.params.code);
  if (!session) return res.status(404).send(`Session ${code} does not exist`);
  const client = session.newClient(req.body.name);
  res.send({ code, client });
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
