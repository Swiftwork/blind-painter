export interface Category {
  id: string;
  name: string;
}

export function isCategory(category: any): category is Category {
  return 'id' in category;
}

export interface Group {
  name: string;
  categories: (Category | Group)[];
}

export function isGroup(group: any): group is Group {
  return 'categories' in group;
}
