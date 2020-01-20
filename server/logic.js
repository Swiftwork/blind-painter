const { Util } = require('./util');

const movies = require('./words/movies.json');
const animals = require('./words/animals.json');

class Logic {
  constructor(sessions, socket) {
    this.sessions = sessions;
    this.socket = socket;
    this.timers = {};
    this.tick = 1000;

    /* EVENTS */
    socket.on('SESSION', this.onSession);
    socket.on('CONNECTION', this.onConnection);
    socket.on('SETTINGS', () => {});
    socket.on('START', this.onStart);
    socket.on('DRAW_START', this.onDrawStart);
    socket.on('DRAW', this.onDraw);
    socket.on('UNDO', this.onUndo);
    // "round" only broadcasted
    socket.on('TURN', this.onTurn);
    socket.on('GUESS', this.onGuess);
    socket.on('END', this.onEnd);
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
      if (session.stage == 'lobby') this.socket.broadcastTo(session.getIds(), 'SESSION', { session, client });
      else this.socket.broadcastTo(socketSession, 'SESSION', { session, client });
    } else {
      this.socket.getConnection(socketSession).close(404, 'Session does not exist');
    }
  };

  onConnection = ({ socketSession, status }) => {
    console.log('logic onConnection', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      client.connected = status == 'connected';
      this.socket.broadcastTo(
        session.getIds(),
        'CONNECTION',
        { clientId: socketSession, status },
        status == 'disconnected' ? [socketSession] : undefined,
      );
    }
  };

  onStart = ({ socketSession }) => {
    console.log('logic onStart', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (session.hostId !== socketSession) return; // Only host can start the game

    const participantIds = session.getIds(true);
    const criticIds = session.getIds(false);
    session.turnOrder = Util.shuffle(participantIds);
    session.blindId = Util.random(participantIds);
    session.subject = Util.random(animals);
    session.stage = 'started';
    this.socket.broadcastTo(participantIds, 'START', { subject: session.subject, blind: false }, [session.blindId]);
    this.socket.broadcastTo(session.blindId, 'START', { subject: 'You are the blind painter', blind: true });
    this.socket.broadcastTo(criticIds, 'START', { subject: 'You are a critic', blind: true });
    setTimeout(() => {
      this.advanceRound(session);
    }, 1000 * 15);
  };

  onDrawStart = ({ socketSession, points }) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    let itteration = client.itterations[session.currentRound - 1];
    if (!itteration) client.itterations.push((itteration = []));

    // Create a new segment
    if (Array.isArray(points)) itteration.push(points);
    else itteration.push([points]);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'DRAW_START', { clientId: socketSession, points }, [socketSession]);
  };

  onDraw = ({ socketSession, points }) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    const itteration = client.itterations[session.currentRound - 1];
    if (!itteration) return;

    const segment = itteration[itteration.length - 1];
    if (!segment) return;

    // Append to last segment
    if (Array.isArray(points)) segment.push(...points);
    else segment.push(points);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'DRAW', { clientId: socketSession, points }, [socketSession]);
  };

  onUndo = ({ socketSession, count }) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    const itteration = client.itterations[session.currentRound - 1];
    if (!itteration) return;

    // Remove count segments
    count = count || Infinity;
    itteration.splice(-1 * count, count);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'UNDO', { clientId: socketSession, count }, [socketSession]);
  };

  onTurn = ({ socketSession }) => {
    console.log('logic onTurn', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (session.stage !== 'started') return;
    if (session.turnId !== socketSession) return; // Only current client may advance turn

    this.advanceTurn(session);
  };

  advanceRound(session) {
    session.currentRound++;
    if (session.currentRound <= session.rounds) {
      console.log('logic advanceRound', session.currentRound);
      this.socket.broadcastTo(session.getIds(), 'ROUND', { current: session.currentRound });
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
      this.socket.broadcastTo(session.getIds(), 'TURN', { clientId });

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
    session.turnId = undefined;
    session.turnElapsed = 0;
    this.socket.broadcastTo(session.getIds(), 'GUESS');

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.endGame(session);
    }, this.tick);
  }

  onGuess = ({ socketSession, guess }) => {
    console.log('logic onGuess', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session.stage == 'guessing') client.guess = guess;
    if (Array.from(session.clients.values()).every(client => !!client.guess)) this.endGame(session);
  };

  endGame(session) {
    clearInterval(this.timers[session.code]);
    console.log('logic endGame');
    session.stage = 'ended';
    session.turnElapsed = 0;
    this.socket.broadcastTo(session.getIds(), 'END', {
      subject: session.subject,
      blindId: session.blindId,
      ...session.getGuesses(),
    });

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.cleanup(session);
    }, this.tick);
  }

  onEnd = ({ socketSession }) => {
    console.log('logic onEnd', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (session.hostId !== socketSession) return; // Only host can end the game

    this.endGame();
  };

  cleanup(session) {
    clearInterval(this.timers[session.code]);
    this.socket.close(session.getIds(), 410, 'Session has ended');
    this.sessions.delete(session.code);
  }
}

module.exports = {
  Logic,
};
