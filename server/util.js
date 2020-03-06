const Hashids = require('hashids/cjs');
const hashids = new Hashids('', 5, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');

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

  static hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  static intToRGB(i) {
    const c = (i & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
  }
}

module.exports = { Util };
