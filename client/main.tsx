import { hot } from 'react-hot-loader/root';
import React from 'react';
import ReactDOM from 'react-dom';

import { Game } from './game';
import { SessionProvider } from './api/session';

const main = () => (
  <SessionProvider>
    <Game />
  </SessionProvider>
);

/* Render hook for multiple of same the fragment */
document.querySelectorAll(`#root`).forEach(element => {
  ReactDOM.render(main(), element);
});

export default hot(main);
