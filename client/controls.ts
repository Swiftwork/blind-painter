import { Actions } from './actions';
import { Util } from './util';

import clearIcon from './assets/icons/clear.svg';
import undoIcon from './assets/icons/undo.svg';
import redoIcon from './assets/icons/redo.svg';
import doneIcon from './assets/icons/done.svg';

export class Controls {
  private $menu: HTMLMenuElement;
  private actions: Actions;

  constructor(actions: Actions) {
    this.actions = actions;

    this.$menu = document.createElement('menu');
    this.$menu.style.position = 'absolute';
    this.$menu.style.top = '0';
    this.$menu.style.right = '0';

    const $clear = Util.Icon(clearIcon.id);
    $clear.addEventListener('click', this.actions.onClear);
    this.$menu.appendChild($clear);

    const $undo = Util.Icon(undoIcon.id);
    $undo.addEventListener('click', this.actions.onUndo);
    this.$menu.appendChild($undo);

    const $redo = Util.Icon(redoIcon.id);
    $redo.addEventListener('click', this.actions.onRedo);
    this.$menu.appendChild($redo);

    const $done = Util.Icon(doneIcon.id);
    $done.addEventListener('click', this.actions.onDone);
    this.$menu.appendChild($done);

    document.body.appendChild(this.$menu);
  }
}
