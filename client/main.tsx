import { hot } from 'react-hot-loader/root';
import React from 'react';
import ReactDOM from 'react-dom';

import { Game } from './game';

const main = () => <Game />;

/* Render hook for multiple of same the fragment */
document.querySelectorAll(`#root`).forEach(element => {
  ReactDOM.render(main(), element);
});

export default hot(main);
