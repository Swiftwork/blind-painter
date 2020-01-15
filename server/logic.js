const { Util } = require('./util');
const movies = require('./words/movies.json');

class Logic {
  constructor(sessions, socket) {
    this.sessions = sessions;
    this.socket = socket;
    this.timers = {};
    this.tick = 1000;

    /* EVENTS */
    socket.on('connected', this.onConnected);
    socket.on('disconnected', this.onDisconnected);
    socket.on('settings', () => {});
    socket.on('start', this.onStart);
    socket.on('draw', () => {});
    socket.on('turn', this.onTurn);
    socket.on('guess', () => {});
    // "reveal" only broadcasted
    // "end" only broadcasted
  }

  getSessionClient(socketSession) {
    const [code, clientId] = socketSession.split('-');
    const session = this.sessions.get(code);
    if (session) {
      const client = session.getClient(clientId);
      return { session, client };
    }
    return {};
  }

  onConnected = ({ socketSession }) => {
    console.log('logic onConnected', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      this.socket.broadcastTo(session.getIds(), 'connected', { session, client });
    }
  };

  onDisconnected = ({ socketSession }) => {
    console.log('logic onDisconnected', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      this.socket.broadcastTo(session.getIds(), 'disconnected', { session, client });
    }
  };

  onStart = ({ socketSession, code }) => {
    console.log('logic onStart', socketSession);
    const session = this.sessions.get(code);
    if (session.host !== socketSession) return; // Only host can start the game

    const ids = session.getIds();
    const participantIds = session.getIds(true);
    session.turnOrder = Util.shuffle(participantIds);
    session.blindId = Util.random(participantIds);
    session.subject = Util.random(movies);
    this.socket.broadcastTo(ids, 'start', { subject: session.subject }, [session.blindId]);
    this.socket.broadcastTo(session.blindId, 'start', { subject: 'You are the blind painter' });
    this.advanceRound(session);
  };

  onDraw = ({ socketSession, code, points }) => {
    console.log('logic onDraw', socketSession);

    const { session, client } = this.getSessionClient(socketSession);
    if (session && client && points && session.turn === socketSession) {
      let itteration = client.itterations[session.currentRound - 1];
      if (!itteration) client.itterations.push((itteration = []));

      if (Array.isArray(points)) itteration = [...itteration, ...points];
      else itteration = [...itteration, points];

      client.itterations[session.currentRound - 1] = itteration;

      const ids = session.getIds();
      this.socket.broadcastTo(ids, 'draw', { code, points }, [socketSession]);
    }
  };

  onTurn = ({ socketSession, code }) => {
    console.log('logic onTurn', socketSession);
    const session = this.sessions.get(code);
    if (session.turn !== socketSession) return; // Only current client may advance turn

    this.advanceTurn(session);
  };

  advanceRound(session) {
    session.currentRound++;
    if (session.currentRound <= session.rounds) {
      console.log('logic advanceRound', session.currentRound);
      this.socket.broadcastTo(session.getIds(), 'round', { current: session.currentRound });
      this.advanceTurn(session);
    } else {
      this.advanceGuess(session);
    }
  }

  advanceTurn(session) {
    clearInterval(this.timers[session.code]);
    session.currentTurn++;
    session.turnElapsed = 0;

    if (session.currentTurn <= session.turnOrder.length) {
      const clientId = session.turnOrder[session.currentTurn - 1];
      session.turnId = clientId;
      console.log('logic advanceTurn', session.currentTurn);
      this.socket.broadcastTo(session.getIds(), 'turn', { clientId });

      this.timers[session.code] = setInterval(() => {
        session.elapsed += this.tick;
        session.turnElapsed += this.tick;
        if (session.turnElapsed > session.turnDuration) this.advanceTurn(session);
      }, this.tick);
    } else {
      session.currentTurn = 0;
      this.advanceRound(session);
    }
  }

  advanceGuess(session) {
    clearInterval(this.timers[session.code]);
    console.log('logic advanceGuess');
    this.socket.broadcastTo(session.getIds(), 'guess');

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.endGame(session);
    }, this.tick);
  }

  endGame(session) {
    clearInterval(this.timers[session.code]);
    console.log('logic endGame');
    this.socket.broadcastTo(session.getIds(), 'end', { subject: session.subject, blindId: session.blindId });
  }
}

module.exports = {
  Logic,
};
