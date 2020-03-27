/// <reference types="express" />
/// <reference types="memcached" />
/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="node" />
/// <reference types="qrcode" />
/// <reference types="react" />
/// <reference types="react-dom" />
/// <reference types="sockjs" />
/// <reference types="sockjs-client" />
/// <reference types="webpack-env" />
/// <reference types="wordcloud" />

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default src;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const src: string;
  export default src;
}

declare module 'nosleep.js' {
  export default class NoSleep {
    enable: () => void;
    disable: () => void;
  }
}
