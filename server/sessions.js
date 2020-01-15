const express = require('express');
const Hashids = require('hashids/cjs');

const endpoints = express.Router();
const hashids = new Hashids('', 5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

const sessions = new Map();

class Session {
  constructor(code) {
    this.code = code;
    this.rounds = 2;
    this.currentRound = 0;
    this.elapsed = 0;
    this.turnId = undefined;
    this.turnOrder = [];
    this.currentTurn = 0;
    this.turnDuration = 1000 * 60;
    this.turnElapsed = 0;
    this.hostId = undefined;
    this.blindId = undefined;
    this.subject = undefined;
    this.clients = new Map();
  }

  newClient(name, participate = true) {
    const id = `${this.code}-${hashids.encode(this.clients.size)}`;
    const client = {
      id,
      name,
      color: '#000',
      guess: undefined,
      participate,
      itterations: [],
    };
    if (!this.clients.size) this.hostId = id;
    this.clients.set(id, client);
    return client;
  }

  getClient(id) {
    return this.clients.get(id);
  }

  deleteClient(id) {
    return this.clients.delete(id);
  }

  getIds(participant) {
    return Array.from(this.clients, ([_, client]) => {
      if (typeof participant === 'boolean' && participant === client.participate) {
        return client.id;
      } else if (typeof participant === 'undefined') {
        return client.id;
      }
      return undefined;
    }).filter(id => !!id);
  }

  toJSON() {
    return {
      code: this.code,
      rounds: this.rounds,
      currentRound: this.currentRound,
      elapsed: this.elapsed,
      turnId: this.turnId,
      turnDuration: this.turnDuration,
      turnElapsed: this.turnElapsed,
      hostId: this.hostId,
      clients: Array.from(this.clients.entries()),
    };
  }
}

/** Fetches or creates a new session based on code
 * @param {string} [code] code identifying the session
 */
function getSession(code, create = true) {
  let session;
  if (typeof code === 'string') {
    session = sessions.get(code);
  } else if (create) {
    const date = Date.now();
    code = hashids.encode(date % (1000 * 60 * 60));
    sessions.set(code, (session = new Session(code)));
  }
  return { code, session };
}

endpoints.post('/', function(req, res) {
  if (!req.body.name) return res.status(400).send(`You must supply a name in request body`);
  const { code, session } = getSession();
  const client = session.newClient(req.body.name, req.body.participate);
  res.send({ code, client });
});

endpoints.put('/:code', function(req, res) {
  if (!req.body.name) return res.status(400).send(`You must supply a name in request body`);
  const { code, session } = getSession(req.params.code, false);
  if (!session) return res.status(404).send(`Session ${code} does not exist`);
  const client = session.newClient(req.body.name, req.body.participate);
  res.send({ code, client });
});

endpoints.delete('/:code/:client', function(req, res) {
  const { code, session } = getSession(req.params.code, false);
  if (!session) return res.status(404).send(`Session ${code} does not exist`);
  if (session.deleteClient(req.params.client)) {
    res.send(`Removed user ${req.params.client} from session ${code}`);
  } else {
    res.status(404).send(`User ${req.params.client} does not exist`);
  }
});

module.exports = {
  sessions,
  endpoints,
};
