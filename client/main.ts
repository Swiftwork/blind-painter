import { Socket } from './socket';
import { Canvas } from './canvas';
import { Actions } from './actions';
import { State } from './state';
import { Controls } from './controls';
import { Splash } from './splash';
import { Players } from './players';
import { Menu } from './menu';

const state = new State();
const canvas = new Canvas(state);
const players = new Players(state);
const socket = new Socket('/socket', canvas, state, players);
const actions = new Actions(canvas, state, socket);
const controls = new Controls(actions);
const splash = new Splash();
const menu = new Menu();
