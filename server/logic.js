const { Util } = require('./util');
const movies = require('./words/movies.json');

class Logic {
  constructor(sessions, socket) {
    this.sessions = sessions;
    this.socket = socket;
    this.timers = {};
    this.tick = 1000;

    /* EVENTS */
    socket.on('session', this.onSession);
    socket.on('disconnected', this.onDisconnected);
    socket.on('settings', () => {});
    socket.on('start', this.onStart);
    socket.on('draw', this.onDraw);
    // "round" only broadcasted
    socket.on('turn', this.onTurn);
    socket.on('guess', () => {});
    socket.on('end', () => {});
    // "reveal" only broadcasted
  }

  getSessionClient(socketSession) {
    const [code] = socketSession.split('-');
    const session = this.sessions.get(code);
    if (session) {
      const client = session.getClient(socketSession);
      return { session, client };
    }
    return {};
  }

  onSession = ({ socketSession }) => {
    console.log('logic onSession', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      client.connected = true;
      this.socket.broadcastTo(session.getIds(), 'session', { session, client });
    } else {
      this.socket.getConnection(socketSession).close(404, 'Session does not exist');
    }
  };

  onDisconnected = ({ socketSession }) => {
    console.log('logic onDisconnected', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      client.connected = false;
      this.socket.broadcastTo(session.getIds(), 'disconnected', { session, client }, [socketSession]);
    }
  };

  onStart = ({ socketSession }) => {
    console.log('logic onStart', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (session.hostId !== socketSession) return; // Only host can start the game

    const ids = session.getIds();
    const participantIds = session.getIds(true);
    session.turnOrder = Util.shuffle(participantIds);
    session.blindId = Util.random(participantIds);
    session.subject = Util.random(movies);
    session.stage = 'started';
    this.socket.broadcastTo(ids, 'start', { subject: session.subject }, [session.blindId]);
    this.socket.broadcastTo(session.blindId, 'start', { subject: 'You are the blind painter' });
    this.advanceRound(session);
  };

  onDraw = ({ socketSession, points }) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client && points && session.turnId === socketSession) {
      let itteration = client.itterations[session.currentRound - 1];
      if (!itteration) client.itterations.push((itteration = []));

      if (Array.isArray(points)) itteration.push([points]);
      else itteration.push([points]);

      console.log(itteration);

      client.itterations[session.currentRound - 1] = itteration;

      const ids = session.getIds();
      this.socket.broadcastTo(ids, 'draw', { clientId: socketSession, points }, [socketSession]);
    }
  };

  onTurn = ({ socketSession }) => {
    console.log('logic onTurn', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (session.turnId !== socketSession) return; // Only current client may advance turn

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
    session.stage = 'guessing';
    this.socket.broadcastTo(session.getIds(), 'guess');

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.endGame(session);
    }, this.tick);
  }

  onEnd = ({ socketSession }) => {
    console.log('logic onEnd', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (session.hostId !== socketSession) return; // Only host can end the game

    this.endGame();
  };

  endGame(session) {
    clearInterval(this.timers[session.code]);
    console.log('logic endGame');
    session.stage = 'ended';
    this.socket.broadcastTo(session.getIds(), 'end', { subject: session.subject, blindId: session.blindId });

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.cleanup(session);
    }, this.tick);
  }

  cleanup(session) {
    clearInterval(this.timers[session.code]);
    this.socket.close(session.getIds(), 410, 'Session has ended');
    this.sessions.delete(session.code);
  }
}

module.exports = {
  Logic,
};
