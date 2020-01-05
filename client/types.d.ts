declare module '*.svg' {
  const svg: {
    id: string;
    viewBox: string;
    content: string;
  };
  export default svg;
}
