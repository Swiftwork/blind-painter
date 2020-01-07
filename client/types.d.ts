/// <reference types="node" />
/// <reference types="webpack-env" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
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
