declare module '*.full.svg' {
  const svg: string;
  export default svg;
}

declare module '*.svg' {
  const svg: {
    id: string;
    viewBox: string;
    content: string;
  };
  export default svg;
}

declare module '*.jpg' {
  const jpg: string;
  export default jpg;
}
