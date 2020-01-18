const express = require('express');
const Hashids = require('hashids/cjs');
const { Util } = require('./util');

const endpoints = express.Router();
const hashids = new Hashids('', 5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

const sessions = new Map();

class Session {
  constructor(code) {
    this.code = code;
    this.stage = 'lobby';
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
    let id = hashids.encode((Date.now() + 1) % (1000 * 60 * 60));
    id = `${this.code}-${id}`;
    const client = {
      id,
      name,
      color: Util.intToRGB(Util.hashCode(id)),
      guess: undefined,
      participate,
      connected: false,
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

  /** Get a list of client ids
   * @param {boolean} [participant] filter list. if omitted get all
   * @returns {string[]} list of client ids
   */
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

  getGuesses() {
    const suspects = [];
    const guesses = [];
    this.clients.forEach(client => {
      if (!client.guess) return;
      if (client.participant && client.id !== this.blindId) return suspects.push(client.guess);
      guesses.push(client.guess);
    });
    return { suspects, guesses };
  }

  toJSON() {
    return {
      code: this.code,
      stage: this.stage,
      rounds: this.rounds,
      currentRound: this.currentRound,
      elapsed: this.elapsed,
      turnId: this.turnId,
      turnDuration: this.turnDuration,
      turnElapsed: this.turnElapsed,
      hostId: this.hostId,
      clients: Array.from(this.clients.entries(), ([id, client]) => {
        const { guess, ...strippedClient } = client;
        return [id, strippedClient];
      }),
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
    code = hashids.encode(Date.now() % (1000 * 60 * 60));
    sessions.set(code, (session = new Session(code)));
  }
  return { code, session };
}

function errorMessage(res, code, reason) {
  res.statusMessage = reason;
  res.status(code).end();
}

endpoints.post('/', function(req, res) {
  if (!req.body.name) return errorMessage(res, 400, `You must supply a name in request body`);
  const { code, session } = getSession();
  const client = session.newClient(req.body.name, req.body.participate);
  res.send({ code, client });
});

endpoints.put('/:code', function(req, res) {
  if (!req.body.name) return errorMessage(res, 400, `You must supply a name in request body`);
  const { code, session } = getSession(req.params.code, false);
  if (!session) return errorMessage(res, 404, `Session ${code} does not exist`);
  if (session.stage !== 'lobby') return errorMessage(res, 404, `Session ${code} has already started`);
  const client = session.newClient(req.body.name, req.body.participate);
  res.send({ code, client });
});

endpoints.delete('/:code/:client', function(req, res) {
  const { code, session } = getSession(req.params.code, false);
  if (!session) return errorMessage(res, 404, `Session ${code} does not exist`);
  if (session.deleteClient(req.params.client)) {
    res.send(`Removed user ${req.params.client} from session ${code}`);
  } else {
    return errorMessage(res, 404, `User ${req.params.client} does not exist`);
  }
});

module.exports = {
  sessions,
  endpoints,
};
