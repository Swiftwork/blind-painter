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
}

module.exports = { Util };
