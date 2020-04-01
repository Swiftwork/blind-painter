import Memcached from 'memcached';
import { Util } from './util';
import { words } from './words';
import { Session } from './sessions';
import {
  SocketPayload,
  C2SStartPayload,
  C2SDrawStartPayload,
  C2SDrawPayload,
  C2SKickPayload,
  C2SUndoPayload,
  C2SGuessPayload,
  SocketAction,
  C2SSessionPayload,
  C2SReactionPayload,
} from 'shared/actions';
import { Socket } from './socket';

const memcached = new Memcached(`${process.env.MEMCACHED_HOST}:${process.env.MEMCACHED_PORT}`);
const reactions = {
  0: ['Wow!', 'Fantabulous!', 'Excellent!', 'Obvious!', 'Impressive!'],
  1: ['Uhm...', 'Not sure...', 'Ok...', 'Confusing...', '???'],
  2: ['Horrible!', 'Weaksauce!', 'Nope!', 'Upsetting!', 'Blind!'],
};

export class Logic {
  private socket: Socket;
  private timers: { [code: string]: NodeJS.Timeout } = {};
  private tick = 1000;

  constructor(socket: Socket) {
    this.socket = socket;

    setInterval(() => {
      console.log(`Current number of sessions is ${sessions.size}`);
    }, 10000);

    /* EVENTS */
    socket.on('SESSION', this.onSession);
    socket.on('CONNECTION', this.onConnection);
    socket.on('ACTION', (action: SocketAction) => {
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

  getSessionClient(socketSession: string) {
    const [code] = socketSession.split('-');
    const session = sessions.get(code);
    if (session) {
      const client = session.getClient(socketSession);
      return { session, client };
    }
    return {};
  }

  onSession = ({ socketSession, players, rounds, turnDuration }: C2SSessionPayload & SocketPayload) => {
    console.log('logic onSession', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client) return this.socket.getConnection(socketSession).close('4000', 'Session does not exist');
    if (session.hostId === socketSession) {
      if (players) session.players = players;
      if (rounds) session.rounds = rounds;
      if (turnDuration) session.turnDuration = turnDuration * 1000;
    }

    if (session.stage == 'lobby') {
      this.socket.broadcastTo(session.getIds(), { type: 'S2C_SESSION', payload: { session, client } });
    } else {
      this.socket.broadcastTo(socketSession, { type: 'S2C_SESSION', payload: { session, client } });
    }
  };

  onConnection = ({ socketSession, status }: { status: 'connected' | 'disconnected' } & SocketPayload) => {
    console.log('logic onConnection', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (session && client) {
      client.connected = status == 'connected';
      this.socket.broadcastTo(
        session.getIds(),
        { type: 'S2C_CONNECTION', payload: { clientId: socketSession, status } },
        status == 'disconnected' ? [socketSession] : undefined,
      );

      if (Array.from(session.clients, ([_, client]) => client.connected).every(connected => !connected)) {
        // Nobody is connected, end session after 1 minutes
        this.timers[`${session.code}-ending`] = setTimeout(() => {
          this.end(session);
        }, 60 * 1000);
      } else {
        clearInterval(this.timers[`${session.code}-ending`]);
      }
    }
  };

  onStart = async ({ socketSession, categoryId }: C2SStartPayload & SocketPayload) => {
    console.log('logic onStart', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (!session || session.hostId !== socketSession) return; // Only host can start the game

    const participantIds = session.getIds(true);
    const criticIds = session.getIds(false);
    const { category, word } = await words.getWord(categoryId);
    session.turnOrder = Util.shuffle(participantIds);
    session.blindId = Util.random(participantIds);
    session.category = category;
    session.subject = word;
    session.stage = 'started';
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

  onDrawStart = ({ socketSession, points }: C2SDrawStartPayload & SocketPayload) => {
    const { session, client } = this.getSessionClient(socketSession);
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
    this.socket.broadcastTo(ids, { type: 'S2C_DRAW', payload: { clientId: socketSession, points } }, [socketSession]);
  };

  onKick = ({ socketSession, clientId }: C2SKickPayload & SocketPayload) => {
    const { session } = this.getSessionClient(socketSession);
    if (!session) return;
    if (session.hostId !== socketSession) return; // Only host can kick
    session.deleteClient(clientId);
    const ids = session.getIds();
    this.socket.broadcastTo(ids, { type: 'S2C_KICK', payload: { clientId } });
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
    this.socket.broadcastTo(ids, { type: 'S2C_UNDO', payload: { clientId: socketSession, count } }, [socketSession]);
  };

  onReaction = ({ socketSession, reaction }: C2SReactionPayload & SocketPayload) => {
    const { session, client } = this.getSessionClient(socketSession);
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
      console.log('logic advanceTurn', session.currentTurn);
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
    console.log('logic advanceGuess');
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
    console.log('logic advanceReveal');
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
    this.socket.broadcastTo(session.getIds(), { type: 'S2C_RESET', payload: { session } });
  }

  onGuess = ({ socketSession, guess }: C2SGuessPayload & SocketPayload) => {
    console.log('logic onGuess', socketSession);
    const { session, client } = this.getSessionClient(socketSession);
    if (!session || !client) return;
    if (session.stage == 'guessing') client.guess = guess;
    if (Array.from(session.clients.values()).every(client => !!client.guess)) this.advanceReveal(session);
  };

  end(session: Session) {
    clearInterval(this.timers[session.code]);
    this.socket.broadcastTo(session.getIds(), { type: 'S2C_END' });
    this.socket.close(session.getIds(), 4000, 'Session has ended');
    sessions.delete(session.code);
  }

  onEnd = ({ socketSession }: SocketPayload) => {
    console.log('logic onEnd', socketSession);
    const { session } = this.getSessionClient(socketSession);
    if (!session) return;
    if (session.hostId !== socketSession) return; // Only host can end the game
    this.end(session);
  };
}
