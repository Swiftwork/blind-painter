import { promises as fs } from 'fs';
import path from 'path';

import { Category, Group, isCategory, isGroup } from 'shared/interfaces';

import { Util } from './util';

export class Words {
  private categories: (Category | Group)[] = [];

  async loadCategories(dir: string): Promise<(Category | Group)[]> {
    const categories = await fs.readdir(dir);
    return Promise.all(
      categories.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          return {
            name: path.basename(filePath),
            categories: await this.loadCategories(filePath),
          };
        } else {
          return {
            id: Util.encodeHex(Buffer.from(path.relative(process.cwd(), filePath)).toString('hex')),
            name: path.basename(filePath, '.json'),
          };
        }
      }),
    );
  }

  async getCategories() {
    if (!this.categories.length) this.categories = await this.loadCategories(path.resolve('words'));
    return this.categories;
  }

  async getWord(categoryId: string) {
    const category = Words.findCategory(this.categories, categoryId);
    if (!category) return;
    const categoryFile = path.resolve(Buffer.from(Util.decodeHex(category.id), 'hex').toString('utf8'));
    const words: string[] = await fs.readFile(categoryFile, 'utf8').then(JSON.parse);
    return Util.random(words);
  }

  static findCategory(categories: (Category | Group)[], id: string): Category | undefined {
    let result: Category | undefined;
    const exists = (category: Category | Group) => {
      if (isCategory(category) && category.id === id) {
        result = category;
        return true;
      }
      if (isGroup(category) && category.categories.length) return category.categories.some(exists);
    };
    categories.some(exists);
    return result;
  }
}

const WORDS_KEY = Symbol.for('Blind.Painter.words');

if (Object.getOwnPropertySymbols(global).indexOf(WORDS_KEY) === -1) {
  (global as any)[WORDS_KEY] = new Words();
}

export const words: Words = (global as any)[WORDS_KEY];
