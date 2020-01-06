import splashImage from './assets/splash.full.svg';

export class Splash {
  $splash: HTMLImageElement;

  constructor() {
    this.$splash = new Image();
    this.$splash.src = splashImage;
    this.$splash.style.position = 'absolute';
    this.$splash.style.bottom = '0';
    this.$splash.style.left = '0';
    this.$splash.style.maxHeight = '75%';
    this.$splash.style.pointerEvents = 'none';
    document.body.appendChild(this.$splash);
  }
}
