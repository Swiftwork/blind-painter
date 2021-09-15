import IORedis from 'ioredis';
import { Session } from './sessions';
import { SocketPayload, S2CAction, C2SAction, SessionAction } from 'shared/actions';

let redis: IORedis.Redis | undefined;
let redisSub: IORedis.Redis | undefined;

export class Redis {
  async getSession(code: string): Promise<{ code: string; session: Session }> {
    if (!redis) redis = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
    code = code.toUpperCase();
    return redis.get(`session-${code}`).then(data => {
      if (!data) throw new Error('Session does not exist in redis');
      return { code, session: Session.parse(data) };
    });
  }

  async setSession(session: Session): Promise<{ code: string; session: Session }> {
    if (!redis) redis = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
    const code = session.code.toUpperCase();
    return redis.set(`session-${code}`, Session.serialize(session)).then(() => {
      return { code, session };
    });
  }

  async deleteSession(session: Session): Promise<boolean> {
    if (!redis) redis = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
    const code = session.code.toUpperCase();
    return redis.del(`session-${code}`).then(() => {
      return true;
    });
  }

  async publishConnection(payload: { status: 'connected' | 'disconnected' } & SocketPayload) {
    if (!redis) redis = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
    return redis.publish('CONNECTION', typeof payload !== 'string' ? JSON.stringify(payload) : payload);
  }

  async publishClientAction(action: string | (C2SAction & { payload: SocketPayload })) {
    if (!redis) redis = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
    return redis.publish('CLIENT_ACTION', typeof action !== 'string' ? JSON.stringify(action) : action);
  }

  async publishServerAction(action: string | S2CAction) {
    if (!redis) redis = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
    return redis.publish('SERVER_ACTION', typeof action !== 'string' ? JSON.stringify(action) : action);
  }

  async subscribe(
    callback: (
      channel: 'CONNECTION' | 'CLIENT_ACTION' | 'SERVER_ACTION',
      action: SessionAction & { payload: SocketPayload },
    ) => void,
  ) {
    if (!redisSub) {
      redisSub = new IORedis(parseInt(process.env.REDIS_PORT || '6379'), process.env.REDIS_HOST);
      await redisSub.subscribe('CONNECTION', 'CLIENT_ACTION', 'SERVER_ACTION');
    }
    redisSub.on('message', (channel, event) => {
      if (channel === 'CONNECTION' || channel === 'CLIENT_ACTION' || channel === 'SERVER_ACTION')
        callback(channel, JSON.parse(event));
    });
  }
}
