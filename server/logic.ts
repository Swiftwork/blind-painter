import { Util } from './util';
import { words } from './words';
import {
  SocketPayload,
  C2SStartPayload,
  C2SDrawStartPayload,
  C2SDrawPayload,
  C2SKickPayload,
  C2SUndoPayload,
  C2SGuessPayload,
  C2SSessionPayload,
  C2SReactionPayload,
  C2SAction,
} from 'shared/actions';
import { Socket } from './socket';
import { Redis } from './redis';
import { Session } from './sessions';

const reactions = {
  0: ['Wow!', 'Fantabulous!', 'Excellent!', 'Obvious!', 'Impressive!'],
  1: ['Uhm...', 'Not sure...', 'Ok...', 'Confusing...', '???'],
  2: ['Horrible!', 'Weaksauce!', 'Nope!', 'Upsetting!', 'Blind!'],
};

export class Logic {
  private timers: { [code: string]: NodeJS.Timeout } = {};
  private tick = 1000;
  private sessions = new Map<string, Session>();

  constructor(private socket: Socket, private redis: Redis) {
    setInterval(() => {
      console.log(`Current number of sessions: ${this.sessions.size}`);
    }, 60000);

    /* EVENTS */
    socket.on('CONNECTION', this.onConnection);
    socket.on('CLIENT_ACTION', (action: C2SAction & { payload: SocketPayload }) => {
      switch (action.type) {
        case 'C2S_SESSION':
          return this.onSession(action.payload);
        case 'C2S_START':
          return this.onStart(action.payload);
        case 'C2S_DRAW_START':
          return this.onDrawStart(action.payload);
        case 'C2S_DRAW':
          return this.onDraw(action.payload);
        case 'C2S_KICK':
          return this.onKick(action.payload);
        case 'C2S_UNDO':
          return this.onUndo(action.payload);
        case 'C2S_REACTION':
          return this.onReaction(action.payload);
        case 'C2S_TURN':
          return this.onTurn(action.payload);
        case 'C2S_GUESS':
          return this.onGuess(action.payload);
        case 'C2S_END':
          return this.onEnd(action.payload);
        default:
          throw new Error(`Unhandled action type: ${(action as any).type}`);
      }
    });
  }

  /* HELPERS */

  ofInterest(socketSession: string) {
    const [code] = socketSession.split('-');
    return !!this.socket.getConnection(socketSession) || !!this.sessions.has(code);
  }

  async getSessionClient(socketSession: string, fromStore = false) {
    const [code] = socketSession.split('-');
    let session: Session | undefined;
    if (fromStore || !this.sessions.has(code)) {
      const redisSession = await this.redis.getSession(code);
      session = redisSession.session;
      this.sessions.set(redisSession.code, session);
    } else {
      session = this.sessions.get(code);
    }
    if (session) {
      const client = session.getClient(socketSession);
      return { session, client };
    }
    return {};
  }

  async updateSession(session: Session) {
    return this.redis.setSession(session);
  }

  async deleteSession(session: Session) {
    return this.redis.deleteSession(session);
  }

  /* EVENTS */

  onConnection = async ({ socketSession, status }: { status: 'connected' | 'disconnected' } & SocketPayload) => {
    console.debug('logic onConnection', socketSession);
    const { session, client } = await this.getSessionClient(socketSession, true);
    if (!session || !client) return this.socket.getConnection(socketSession).close('4000', 'Session does not exist');

    client.connected = status == 'connected';
    await this.updateSession(session);

    if (session.stage !== 'started') {
      // Send current session state to all connected clients
      this.socket.broadcastTo(session.getIds(), { type: 'S2C_SESSION', payload: { session, client } });
    } else {
      // Is started, send current session state only to new client
      this.socket.broadcastTo(socketSession, { type: 'S2C_SESSION', payload: { session, client } });
    }

    // Send connection status to all other sockets
    this.socket.broadcastTo(
      session.getIds(),
      { type: 'S2C_CONNECTION', payload: { clientId: socketSession, status } },
      [socketSession],
    );

    // If nobody is connected, end session after 1 minutes
    if (Array.from(session.clients, ([_, client]) => client.connected).every(connected => !connected)) {
      this.timers[`${session.code}-ending`] = setTimeout(() => {
        this.end(session);
      }, 60 * 1000);
    } else {
      clearInterval(this.timers[`${session.code}-ending`]);
    }
  };

  onSession = async ({ socketSession, players, rounds, turnDuration }: C2SSessionPayload & SocketPayload) => {
    console.debug('logic onSession', socketSession);
    const { session, client } = await this.getSessionClient(socketSession, true);
    if (!session || !client) return;

    // Settings
    if (session.hostId === socketSession) {
      if (players) session.players = players;
      if (rounds) session.rounds = rounds;
      if (turnDuration) session.turnDuration = turnDuration * 1000;
      await this.updateSession(session);
    }

    this.socket.broadcastTo(session.getIds(), { type: 'S2C_SESSION', payload: { session, client } });
  };

  onStart = async ({ socketSession, categoryId }: C2SStartPayload & SocketPayload) => {
    console.debug('logic onStart', socketSession);
    const { session } = await this.getSessionClient(socketSession);
    if (!session || session.hostId !== socketSession) return; // Only host can start the game

    const participantIds = session.getIds(true);
    const criticIds = session.getIds(false);
    const { category, word } = await words.getWord(categoryId);
    session.turnOrder = Util.shuffle(participantIds);
    session.blindId = Util.random(participantIds);
    session.category = category;
    session.subject = word;
    session.stage = 'started';
    this.updateSession(session);
    this.socket.broadcastTo(
      participantIds,
      {
        type: 'S2C_START',
        payload: {
          category: session.category || '',
          subject: session.subject || '',
          turnOrder: session.turnOrder,
          blind: false,
        },
      },
      [session.blindId],
    );
    this.socket.broadcastTo(session.blindId, {
      type: 'S2C_START',
      payload: {
        category: session.category || '',
        subject: 'You are the blind painter',
        turnOrder: session.turnOrder,
        blind: true,
      },
    });
    this.socket.broadcastTo(criticIds, {
      type: 'S2C_START',
      payload: {
        category: session.category || '',
        subject: 'You are a critic',
        turnOrder: session.turnOrder,
        blind: true,
      },
    });
    setTimeout(() => {
      this.advanceRound(session);
    }, 1000 * 15);
  };

  onDrawStart = async ({ socketSession, points }: C2SDrawStartPayload & SocketPayload) => {
    const { session, client } = await this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    let iteration = client.iterations[session.currentRound - 1];
    if (!iteration) client.iterations.push((iteration = []));

    // Create a new segment
    if (Array.isArray(points)) iteration.push(points);
    else iteration.push([points]);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, { type: 'S2C_DRAW_START', payload: { clientId: socketSession, points } }, [
      socketSession,
    ]);
  };

  onDraw = async ({ socketSession, points }: C2SDrawPayload & SocketPayload) => {
    const { session, client } = await this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    const iteration = client.iterations[session.currentRound - 1];
    if (!iteration) return;

    const segment = iteration[iteration.length - 1];
    if (!segment) return;

    // Append to last segment
    if (Array.isArray(points)) segment.push(...points);
    else segment.push(points);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, { type: 'S2C_DRAW', payload: { clientId: socketSession, points } }, [socketSession]);
  };

  onKick = async ({ socketSession, clientId }: C2SKickPayload & SocketPayload) => {
    const { session } = await this.getSessionClient(socketSession);
    if (!session) return;
    if (session.hostId !== socketSession) return; // Only host can kick
    session.deleteClient(clientId);
    this.updateSession(session);
    const ids = session.getIds();
    this.socket.broadcastTo(ids, { type: 'S2C_KICK', payload: { clientId } });
  };

  onUndo = async ({ socketSession, count }: C2SUndoPayload & SocketPayload) => {
    const { session, client } = await this.getSessionClient(socketSession);
    if (!session || !client || session.turnId !== socketSession) return;

    const iteration = client.iterations[session.currentRound - 1];
    if (!iteration) return;

    // Remove count segments
    count = count || Infinity;
    iteration.splice(-1 * count, count);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, { type: 'S2C_UNDO', payload: { clientId: socketSession, count } }, [socketSession]);
  };

  onReaction = async ({ socketSession, reaction }: C2SReactionPayload & SocketPayload) => {
    const { session, client } = await this.getSessionClient(socketSession);
    if (!session || !client || session.turnId === socketSession) return;

    const oldReaction = client.reaction;
    do client.reaction = Util.random(reactions[reaction]);
    while (client.reaction === oldReaction);

    const ids = session.getIds();
    this.socket.broadcastTo(ids, {
      type: 'S2C_REACTION',
      payload: { clientId: socketSession, reaction: client.reaction },
    });
  };

  onTurn = async ({ socketSession }: SocketPayload) => {
    console.debug('logic onTurn', socketSession);
    const { session } = await this.getSessionClient(socketSession);
    if (!session) return;
    if (session.stage !== 'started') return;
    if (session.turnId !== socketSession) return; // Only current client may advance turn

    this.advanceTurn(session);
  };

  advanceRound(session: Session) {
    session.currentRound++;
    if (session.currentRound <= session.rounds) {
      console.debug('logic advanceRound', session.currentRound);
      this.socket.broadcastTo(session.getIds(), { type: 'S2C_ROUND', payload: { current: session.currentRound } });
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
      console.debug('logic advanceTurn', session.currentTurn);
      this.socket.broadcastTo(session.getIds(), { type: 'S2C_TURN', payload: { clientId } });

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
    console.debug('logic advanceGuess');
    session.stage = 'guessing';
    session.turnId = undefined;
    session.turnElapsed = 0;
    this.socket.broadcastTo(session.getIds(), { type: 'S2C_GUESS' });

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.advanceReveal(session);
    }, this.tick);
  }

  advanceReveal(session: Session) {
    clearInterval(this.timers[session.code]);
    console.debug('logic advanceReveal');
    session.stage = 'reveal';
    session.turnElapsed = 0;
    this.socket.broadcastTo(session.getIds(), {
      type: 'S2C_REVEAL',
      payload: {
        category: session.category || '',
        subject: session.subject || '',
        blindId: session.blindId || '',
        ...session.getGuesses(),
      },
    });

    this.timers[session.code] = setInterval(() => {
      session.elapsed += this.tick;
      session.turnElapsed += this.tick;
      if (session.turnElapsed > session.turnDuration) this.reset(session);
    }, this.tick);
  }

  reset(session: Session) {
    clearInterval(this.timers[session.code]);
    session.reset();
    this.updateSession(session);
    this.socket.broadcastTo(session.getIds(), { type: 'S2C_RESET', payload: { session } });
  }

  onGuess = async ({ socketSession, guess }: C2SGuessPayload & SocketPayload) => {
    console.debug('logic onGuess', socketSession);
    const { session, client } = await this.getSessionClient(socketSession);
    if (!session || !client) return;
    if (session.stage == 'guessing') client.guess = guess;
    if (Array.from(session.clients.values()).every(client => !!client.guess)) this.advanceReveal(session);
  };

  end(session: Session) {
    clearInterval(this.timers[session.code]);
    this.socket.broadcastTo(session.getIds(), { type: 'S2C_END' });
    this.socket.close(session.getIds(), 4000, 'Session has ended');
    this.sessions.delete(session.code);
    this.deleteSession(session);
  }

  onEnd = async ({ socketSession }: SocketPayload) => {
    console.debug('logic onEnd', socketSession);
    const { session } = await this.getSessionClient(socketSession);
    if (!session) return;
    if (session.hostId !== socketSession) return; // Only host can end the game
    this.end(session);
  };
}
