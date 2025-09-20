// utils/category.ts
export function truncateCategories(categories: any[], maxDepth: number, currentDepth = 1): any[] {
  if (!categories || currentDepth > maxDepth) return [];

  return categories.map((cat) => ({
    ...cat,
    children: truncateCategories(cat.children, maxDepth, currentDepth + 1),
  }));
}

export function getCategoryPath(categories: any[], selectedName: string): any[] {
  for (const cat of categories) {
    if (cat.name === selectedName) return [cat];
    if (cat.children) {
      const childPath = getCategoryPath(cat.children, selectedName);
      if (childPath.length) return [cat, ...childPath];
    }
  }
  return [];
}
