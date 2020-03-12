const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const { Util } = require('./util');

const wordEndpoints = express.Router();

class Words {
  constructor() {
    this.loadCategories(path.resolve('words')).then(categories => (this.categories = categories));
  }

  async loadCategories(dir) {
    const categories = await fs.readdir(dir);
    const wordFiles = await Promise.all(
      categories.map(async file => {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          return {
            name: path.basename(filePath),
            categories: await this.loadCategories(filePath),
          };
        } else if (stats.isFile())
          return {
            id: Util.encodeHex(Buffer.from(path.relative(process.cwd(), filePath)).toString('hex')),
            name: path.basename(filePath, '.json'),
          };
      }),
    );

    return wordFiles;
  }

  getCategories() {
    return this.categories;
  }

  async getWord(categoryId) {
    const category = Words.findCategory(this.categories, categoryId);
    if (!category) return null;
    const categoryFile = path.resolve(Buffer.from(Util.decodeHex(category.id), 'hex').toString('utf8'));
    const words = await fs.readFile(categoryFile, 'utf8').then(JSON.parse);
    return Util.random(words);
  }

  static findCategory(categories, id) {
    for (const category of categories) {
      if (category.id === id) return category;
      if (category.categories) return Words.findCategory(category.categories, id);
    }
    return null;
  }
}

module.exports = { Words };
