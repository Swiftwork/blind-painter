import { Socket } from './socket';
import { Canvas } from './canvas';
import { Actions } from './actions';
import { State } from './state';
import { Menu } from './menu';
import { Splash } from './splash';
import { Players } from './players';

const state = new State();
const canvas = new Canvas(state);
const players = new Players(state);
const socket = new Socket('/socket', canvas, state, players);
const actions = new Actions(canvas, state, socket);
const menu = new Menu(actions);
const splash = new Splash();
