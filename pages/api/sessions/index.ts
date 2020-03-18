import { NextApiRequest, NextApiResponse } from 'next';

import { Session, sessions } from 'server/sessions';
import { Util } from 'server/util';

/** Creates a new session based on code */
function createSession() {
  const code = Util.encode(Date.now() % (1000 * 60 * 60));
  const session = new Session(code);
  sessions.set(code, session);
  return { code, session };
}

function errorMessage(res: NextApiResponse, code = 200, reason = 'ok') {
  res.statusMessage = reason;
  res.status(code).end();
}

function post(req: NextApiRequest, res: NextApiResponse) {
  const {
    body: { name, participant },
  } = req;
  console.log(`Requesting a new session using name ${name} and participation ${participant}`);
  if (!name) return errorMessage(res, 400, `You must supply a name in request body`);
  const { code, session } = createSession();
  const client = session.newClient(name, participant);
  res.send({ code, client });
}

/*
function kick(req: NextApiRequest, res: NextApiResponse) {
  console.log(`Requesting to remove user ${req.params.client} from session ${req.params.code}`);
  const { code, session } = getSession(req.params.code, false);
  if (!session) return errorMessage(res, 404, `Session ${code} does not exist`);
  if (session.deleteClient(req.params.client)) {
    res.send(`Removed user ${req.params.client} from session ${code}`);
  } else {
    return errorMessage(res, 404, `User ${req.params.client} does not exist`);
  }
}
*/

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
