require('dotenv').config();
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

const { endpoint } = require('./server/sessions');
app.use('/sessions', endpoint);

server.listen(5200, '0.0.0.0', () => {
  console.log(' [*] Listening on 0.0.0.0:5200');
});
