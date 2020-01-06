export class Menu {
  $form: HTMLFormElement;

  constructor() {
    this.$form = document.createElement('form');
    this.$form.style.position = 'absolute';
    this.$form.style.top = '0';

    const $code = document.createElement('input');
    $code.setAttribute('autocomplete', 'off');
    $code.setAttribute('autocorrect', 'off');
    $code.setAttribute('autocapitalize', 'off');
    $code.setAttribute('spellcheck', 'false');
    $code.style.backgroundColor = 'rgba(255,255,255,0.5)';
    $code.style.border = '2px solid';
    $code.style.padding = '0.5em';
    $code.style.letterSpacing = '4px';
    $code.style.fontSize = '1.5em';
    this.$form.appendChild($code);

    const $painter = document.createElement('button');
    $painter.setAttribute('type', 'button');
    $painter.textContent = 'Join as painter';
    $painter.style.padding = '0.5em';
    $painter.style.fontSize = '1.5em';
    this.$form.appendChild($painter);

    const $critic = document.createElement('button');
    $critic.setAttribute('type', 'button');
    $critic.textContent = 'Join as critic';
    $critic.style.padding = '0.5em';
    $critic.style.fontSize = '1.5em';
    this.$form.appendChild($critic);

    document.body.appendChild(this.$form);
  }
}
