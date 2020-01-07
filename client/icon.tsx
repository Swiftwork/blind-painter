export const Icon = (id: string, size = 32) => {
  const svgns = 'http://www.w3.org/2000/svg';
  const xlinkns = 'http://www.w3.org/1999/xlink';
  const $svg = document.createElementNS(svgns, 'svg');
  $svg.style.width = `${size}px`;
  $svg.style.height = `${size}px`;
  const $use = document.createElementNS(svgns, 'use');
  $use.setAttributeNS(xlinkns, 'href', `#${id}`);
  $svg.appendChild($use);
  return $svg;
};
