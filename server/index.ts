require('dotenv').config();
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import express from 'express';
import next from 'next';

import { sessions } from './sessions';
import { Socket } from './socket';
import { Logic } from './logic';

const app = express();
const server = createServer(app);

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const socket = new Socket(server);
  new Logic(sessions, socket);

  app.use((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    nextHandler(req, res, parsedUrl);
  });

  server.listen(3005, '0.0.0.0', () => {
    console.log('> Ready on http://localhost:3005/');
  });
});
