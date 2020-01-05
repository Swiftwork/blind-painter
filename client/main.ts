import { Socket } from './socket';
import { Canvas } from './canvas';
import { Actions } from './actions';
import { State } from './state';
import { Menu } from './menu';

const state = new State();
const canvas = new Canvas(state);
const socket = new Socket('/socket', canvas, state);
const actions = new Actions(canvas, state, socket);
const menu = new Menu(actions);
