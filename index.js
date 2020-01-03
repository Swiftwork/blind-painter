'use strict';

require('dotenv').config();
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);

app.use(express.static('dist'));

//------------------------------------------------------------------------------------
// HOT RELOAD FOR DEVELOPMENT
//------------------------------------------------------------------------------------

if (process.env.NODE_ENV === 'development') {
  /* Load Config and Setup Compilers */
  const webpack = require('webpack');
  const config = require('./webpack.config')(undefined, { mode: 'development' });
  config.entry.push('webpack-hot-middleware/client?reload=true');
  const compiler = webpack(config);

  app.use(require('webpack-dev-middleware')(compiler));
  app.use(require('webpack-hot-middleware')(compiler));
}

//------------------------------------------------------------------------------------
// ENDPOINTS
//------------------------------------------------------------------------------------

const { socket } = require('./server/socket');
socket(server);

server.listen(51337, '0.0.0.0', () => {
  console.log(' [*] Listening on 0.0.0.0:9999');
});
