import { Socket } from './socket';
import { Canvas } from './canvas';
import { Actions } from './actions';
import { State } from 'state';

const state = new State();
const canvas = new Canvas(document.getElementById('canvas') as HTMLCanvasElement, state);
const socket = new Socket('/socket', canvas, state);
const actions = new Actions(document.getElementById('canvas') as HTMLCanvasElement, canvas, state, socket);
