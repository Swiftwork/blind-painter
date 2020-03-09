const Hashids = require('hashids/cjs');
const hashids = new Hashids('', 5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
const colors = [
  '#91278e',
  '#00aeef',
  '#00a550',
  '#ee1d24',
  '#f8941d',
  '#00a99d',
  '#bf235e',
  '#8cc63f',
  '#4979bd',
  '#c28a7b',
  '#56787d',
];

class Util {
  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static random(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static encode(n) {
    return hashids.encode(n);
  }

  static encodeHex(str) {
    return hashids.encodeHex(str);
  }

  static decode(n) {
    return hashids.decode(n);
  }

  static decodeHex(str) {
    return hashids.decodeHex(str);
  }

  static getColor(i) {
    return colors[i];
  }
}

module.exports = { Util };
