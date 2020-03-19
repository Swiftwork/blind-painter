import { promises as fs } from 'fs';
import Hashids from 'hashids';
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

export class Util {
  static shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  static encode(n: number) {
    return hashids.encode(n);
  }

  static encodeHex(str: string) {
    return hashids.encodeHex(str);
  }

  static decode(str: string) {
    return hashids.decode(str);
  }

  static decodeHex(str: string) {
    return hashids.decodeHex(str);
  }

  static getColor(i: number) {
    return colors[i];
  }

  static async isDirectory(directory: string) {
    try {
      const stat = await fs.stat(directory);
      return stat.isDirectory();
    } catch (_err) {
      return false;
    }
  }

  static async isFile(file: string) {
    try {
      const stat = await fs.stat(file);
      return stat.isFile();
    } catch (_err) {
      return false;
    }
  }
}
