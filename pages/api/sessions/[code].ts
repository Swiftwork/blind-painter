import { NextApiRequest, NextApiResponse } from 'next';

import { sessions } from 'server/sessions';

/** Fetches a session based on code
 * @param {string} [code] code identifying the session
 */
function getSession(code: string) {
  code = code.toUpperCase();
  const session = sessions.get(code);
  return { code, session };
}

function errorMessage(res: NextApiResponse, code = 200, reason = 'ok') {
  res.statusMessage = reason;
  res.status(code).end();
}

function put(req: NextApiRequest, res: NextApiResponse) {
  const {
    body: { name, participant },
    query: { code: queryCode },
  } = req;
  console.log(`Requesting to join session ${queryCode} using name ${name} and participation ${participant}`);
  if (!name) return errorMessage(res, 400, `You must supply a name in request body`);
  const { code, session } = getSession(queryCode as string);
  if (!session) return errorMessage(res, 404, `Session ${code} does not exist`);
  if (session.stage !== 'lobby') return errorMessage(res, 404, `Session ${code} has already started`);
  if (participant && session.getIds(true).length >= 10)
    return errorMessage(res, 403, `Session ${code} already has the maximum of 10 participants`);
  const client = session.newClient(name, participant);
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
