import { Actions } from './actions';

import clearIcon from './assets/icons/clear.svg';
import undoIcon from './assets/icons/undo.svg';
import redoIcon from './assets/icons/redo.svg';
import doneIcon from './assets/icons/done.svg';

export class Menu {
  private $menu: HTMLMenuElement;
  private actions: Actions;

  constructor(actions: Actions) {
    this.actions = actions;

    this.$menu = document.createElement('menu');
    this.$menu.style.position = 'absolute';
    this.$menu.style.top = '0';
    this.$menu.style.right = '0';

    const $clear = Menu.Icon(clearIcon.id);
    $clear.addEventListener('click', this.actions.onClear);
    this.$menu.appendChild($clear);

    const $undo = Menu.Icon(undoIcon.id);
    $undo.addEventListener('click', this.actions.onUndo);
    this.$menu.appendChild($undo);

    const $redo = Menu.Icon(redoIcon.id);
    $redo.addEventListener('click', this.actions.onRedo);
    this.$menu.appendChild($redo);

    const $done = Menu.Icon(doneIcon.id);
    $done.addEventListener('click', this.actions.onDone);
    this.$menu.appendChild($done);

    document.body.appendChild(this.$menu);
  }

  static Icon(id: string, size = 32) {
    const svgns = 'http://www.w3.org/2000/svg';
    const xlinkns = 'http://www.w3.org/1999/xlink';
    const $svg = document.createElementNS(svgns, 'svg');
    $svg.style.width = `${size}px`;
    $svg.style.height = `${size}px`;
    const $use = document.createElementNS(svgns, 'use');
    $use.setAttributeNS(xlinkns, 'href', `#${id}`);
    $svg.appendChild($use);
    return $svg;
  }
}
