require('dotenv').config();
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import express from 'express';
import next from 'next';
import minimist from 'minimist';

import { Socket } from './socket';
import { Logic } from './logic';
import { Redis } from './redis';
import { AddressInfo } from 'net';

const argv = minimist(process.argv.slice(2));
const app = express();
const server = createServer(app);

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const redis = new Redis();
  const socket = new Socket(server, redis);
  new Logic(socket, redis);

  app.use((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    nextHandler(req, res, parsedUrl);
  });

  server.listen(argv.port || 3005, '0.0.0.0', () => {
    const address = server.address() as AddressInfo;
    console.log(`> Ready on http://${address ? address.address : 'localhost'}:${argv.port || 3005}/'`);
  });
});
