import { NextApiRequest, NextApiResponse } from 'next';
import { Session } from 'server/sessions';
import { Redis } from 'server/redis';

const redis = new Redis();

/** Fetches a session based on code
 * @param code code identifying the session
 */
async function getSession(code: string) {
  code = code.toUpperCase();
  return redis.getSession(code).then(redisSession => {
    if (!redisSession) throw new Error('Session does not exist in redis');
    return redisSession;
  });
}

async function updateSession(session: Session) {
  return redis.setSession(session).then(redisSession => {
    if (!redisSession) throw new Error('Session does not exist in redis');
    return redisSession;
  });
}

function errorMessage(res: NextApiResponse, code = 200, reason = 'ok') {
  res.statusMessage = reason;
  res.status(code).end();
}

async function put(req: NextApiRequest, res: NextApiResponse) {
  const {
    body: { name, participant },
    query: { code: queryCode },
  } = req;
  console.log(`Requesting to join session ${queryCode} using name ${name} and participation ${participant}`);
  if (!name) return errorMessage(res, 400, `You must supply a name in request body`);
  const { code, session } = await getSession(queryCode as string);
  if (!session) return errorMessage(res, 404, `Session ${code} does not exist`);
  if (session.stage !== 'lobby') return errorMessage(res, 404, `Session ${code} has already started`);
  const client = await session.newClient(name, participant);
  if (!client)
    return errorMessage(res, 403, `Session ${code} already has the maximum of ${session.players} participants`);
  await updateSession(session);
  res.send({ code, client });
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'PUT':
      put(req, res);
      break;
    default:
      res.status(405).end(); //Method Not Allowed
      break;
  }
};
