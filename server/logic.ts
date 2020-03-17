import { Util } from './util';
import { Words } from './words';
import { Session, sessions } from './sessions';
import {
  SocketPayload,
  C2SStartPayload,
  C2SDrawStartPayload,
  C2SDrawPayload,
  C2SKickPayload,
  C2SUndoPayload,
  C2SGuessPayload,
} from 'shared/actions';
import { Socket } from './socket';

export class Logic {
  private socket: Socket;
  private timers: { [code: string]: NodeJS.Timeout } = {};
  private tick = 1000;
  private words: Words;

  constructor(socket: Socket) {
    this.socket = socket;
    this.words = new Words();

    /* EVENTS */
    socket.on('SESSION', this.onSession);
    socket.on('CONNECTION', this.onConnection);
    socket.on('C2S_SETTINGS', () => {});
    socket.on('C2S_START', this.onStart);
    socket.on('C2S_DRAW_START', this.onDrawStart);
    socket.on('C2S_DRAW', this.onDraw);
    socket.on('C2S_KICK', this.onKick);
    socket.on('C2S_UNDO', this.onUndo);
    // "round" only broadcasted
    socket.on('C2S_TURN', this.onTurn);
    socket.on('C2S_GUESS', this.onGuess);
    socket.on('C2S_END', this.onEnd);
    // "reveal" only broadcasted
  }

  getSessionClient(socketSession: string) {
    const [code] = socketSession.split('-');
    const session = sessions.get(code);
    if (session) {
      const client = session.getClient(socketSession);
      return { session, client };
    }
    return {};
  }

  onSession = ({ socketSession }: SocketPayload) => {
    console.log('logic onSession', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      if (session.stage == 'lobby') this.socket.broadcastTo(session.getIds(), 'S2C_SESSION', { session, client });
      else this.socket.broadcastTo(socketSession, 'S2C_SESSION', { session, client });
    } else {
      this.socket.getConnection(socketSession).close('404', 'Session does not exist');
    }
  };

  onConnection = ({ socketSession, status }: { status: 'connected' | 'disconnected' } & SocketPayload) => {
    console.log('logic onConnection', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      client.connected = status == 'connected';
      this.socket.broadcastTo(
        session.getIds(),
        'S2C_CONNECTION',
        { clientId: socketSession, status },
        status == 'disconnected' ? [socketSession] : undefined,
      );
    }
  };

  onStart = async ({ socketSession, categoryId }: C2SStartPayload & SocketPayload) => {
    console.log('logic onStart', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (!session || session.hostId !== socketSession) return; // Only host can start the game

    const participantIds = session.getIds(true);
    const criticIds = session.getIds(false);
    session.turnOrder = Util.shuffle(participantIds);
    session.blindId = Util.random(participantIds);
    session.subject = await this.words.getWord(categoryId);
    session.stage = 'started';
    this.socket.broadcastTo(
      participantIds,
      'S2C_START',
      { subject: session.subject, turnOrder: session.turnOrder, blind: false },
      [session.blindId],
    );
    this.socket.broadcastTo(session.blindId, 'S2C_START', {
      subject: 'You are the blind painter',
      turnOrder: session.turnOrder,
      blind: true,
    });
    this.socket.broadcastTo(criticIds, 'S2C_START', {
      subject: 'You are a critic',
      turnOrder: session.turnOrder,
      blind: true,
    });
    setTimeout(() => {
      this.advanceRound(session);
    }, 1000 * 15);
  };

  onDrawStart = ({ socketSession, points }: C2SDrawStartPayload & SocketPayload) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    let iteration = client.iterations[session.currentRound - 1];
    if (!iteration) client.iterations.push((iteration = []));

    // Create a new segment
    if (Array.isArray(points)) iteration.push(points);
    else iteration.push([points]);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'S2C_DRAW_START', { clientId: socketSession, points }, [socketSession]);
  };

  onDraw = ({ socketSession, points }: C2SDrawPayload & SocketPayload) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    const iteration = client.iterations[session.currentRound - 1];
    if (!iteration) return;

    const segment = iteration[iteration.length - 1];
    if (!segment) return;

    // Append to last segment
    if (Array.isArray(points)) segment.push(...points);
    else segment.push(points);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'S2C_DRAW', { clientId: socketSession, points }, [socketSession]);
  };

  onKick = ({ socketSession, clientId }: C2SKickPayload & SocketPayload) => {
    const { session } = this.getSessionClient(socketSession);
    if (!session) return;
    if (session.hostId !== socketSession) return; // Only host can kick
    session.deleteClient(clientId);
    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'S2C_KICK', { clientId });
  };

  onUndo = ({ socketSession, count }: C2SUndoPayload & SocketPayload) => {
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    const iteration = client.iterations[session.currentRound - 1];
    if (!iteration) return;

    // Remove count segments
    count = count || Infinity;
    iteration.splice(-1 * count, count);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, 'S2C_UNDO', { clientId: socketSession, count }, [socketSession]);
  };

  onTurn = ({ socketSession }: SocketPayload) => {
    console.log('logic onTurn', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (!session) return;
    if (session.stage !== 'started') return;
    if (session.turnId !== socketSession) return; // Only current client may advance turn

    this.advanceTurn(session);
  };

  advanceRound(session: Session) {
    session.currentRound++;
    if (session.currentRound <= session.rounds) {
      console.log('logic advanceRound', session.currentRound);
      this.socket.broadcastTo(session.getIds(), 'S2C_ROUND', { current: session.currentRound });
      this.advanceTurn(session);
    } else {
      this.advanceGuess(session);
    }
  }

  advanceTurn(session: Session) {
    clearInterval(this.timers[session.code]);
    session.currentTurn++;
    session.turnElapsed = 0;

    if (session.currentTurn <= session.turnOrder.length) {
      const clientId = session.turnOrder[session.currentTurn - 1];
      session.turnId = clientId;
      console.log('logic advanceTurn', session.currentTurn);
      this.socket.broadcastTo(session.getIds(), 'S2C_TURN', { clientId });

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

  advanceGuess(session: Session) {
    clearInterval(this.timers[session.code]);
    console.log('logic advanceGuess');
    session.stage = 'guessing';
    session.turnId = undefined;
    session.turnElapsed = 0;
    this.socket.broadcastTo(session.getIds(), 'S2C_GUESS');

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.endGame(session);
    }, this.tick);
  }

  onGuess = ({ socketSession, guess }: C2SGuessPayload & SocketPayload) => {
    console.log('logic onGuess', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (!session) return;
    if (session.stage == 'guessing') client.guess = guess;
    if (Array.from(session.clients.values()).every(client => !!client.guess)) this.endGame(session);
  };

  endGame(session: Session) {
    clearInterval(this.timers[session.code]);
    console.log('logic endGame');
    session.stage = 'ended';
    session.turnElapsed = 0;
    this.socket.broadcastTo(session.getIds(), 'S2C_END', {
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

  onEnd = ({ socketSession }: SocketPayload) => {
    console.log('logic onEnd', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (!session) return;
    if (session.hostId !== socketSession) return; // Only host can end the game

    this.endGame(session);
  };

  cleanup(session: Session) {
    clearInterval(this.timers[session.code]);
    this.socket.close(session.getIds(), 410, 'Session has ended');
    sessions.delete(session.code);
  }
}
