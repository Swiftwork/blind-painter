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
    if (!this.categories) this.categories = await this.loadCategories(path.resolve('words'));
    return this.categories;
  }

  async getWord(categoryId: string) {
    const category = Words.findCategory(this.categories, categoryId);
    if (!category) return null;
    const categoryFile = path.resolve(Buffer.from(Util.decodeHex(category.id), 'hex').toString('utf8'));
    const words = await fs.readFile(categoryFile, 'utf8').then(JSON.parse);
    return Util.random(words);
  }

  static findCategory(categories: (Category | Group)[], id: string): Category | null {
    for (const category of categories) {
      if (isCategory(category) && category.id === id) return category;
      if (isGroup(category) && category.categories.length) return Words.findCategory(category.categories, id);
    }
    return null;
  }
}
