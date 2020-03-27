import { NextApiRequest, NextApiResponse } from 'next';
import Memcached from 'memcached';

import { Session } from 'server/sessions';
import { Util } from 'server/util';

const memcached = new Memcached(`${process.env.MEMCACHED_HOST}:${process.env.MEMCACHED_PORT}`);

/** Creates a new session based on code */
async function createSession() {
  return new Promise<{ code: string; session: Session }>((resolve, reject) => {
    const code = Util.encode(Date.now() % (1000 * 60 * 60));
    const session = new Session(code);
    memcached.set(`session-${code}`, JSON.stringify(session), 1000 * 60 * 60, err => {
      if (err) return reject(err);
      resolve({ code, session });
    });
  });
}

function errorMessage(res: NextApiResponse, code = 200, reason = 'ok') {
  res.statusMessage = reason;
  res.status(code).end();
}

async function post(req: NextApiRequest, res: NextApiResponse) {
  const {
    body: { name, participant },
  } = req;
  console.log(`Requesting a new session using name ${name} and participation ${participant}`);
  if (!name) return errorMessage(res, 400, `You must supply a name in request body`);
  const { code, session } = await createSession();
  const client = await session.newClient(name, participant);
  res.send({ code, client });
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case 'POST':
      post(req, res);
      break;
    default:
      res.status(405).end(); //Method Not Allowed
      break;
  }
};
