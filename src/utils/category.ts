// @/utils/category.ts

export interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
  image?: string;
  highlight?: boolean;
  count?: number;
}

/**
 * Truncate categories to a specific depth
 */
export const truncateCategories = (categories: Category[], maxDepth: number): Category[] => {
  const truncate = (cats: Category[], depth: number): Category[] => {
    if (depth >= maxDepth) {
      return cats.map(cat => ({ ...cat, children: undefined }));
    }
    
    return cats.map(cat => ({
      ...cat,
      children: cat.children ? truncate(cat.children, depth + 1) : undefined
    }));
  };
  
  return truncate(categories, 1);
};

/**
 * Get the breadcrumb path for a category
 */
export const getCategoryPath = (categories: Category[], categoryId: string): Category[] => {
  const findPath = (cats: Category[], targetId: string, path: Category[] = []): Category[] | null => {
    for (const cat of cats) {
      const currentPath = [...path, cat];
      
      if (cat.id === targetId) {
        return currentPath;
      }
      
      if (cat.children) {
        const found = findPath(cat.children, targetId, currentPath);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findPath(categories, categoryId) || [];
};

/**
 * Find all leaf categories (categories without children) under a given category
 */
export const findLeafCategories = (categories: Category[], categoryId: string): Category[] => {
  const leafCategories: Category[] = [];
  
  const findLeaves = (category: Category) => {
    if (!category.children || category.children.length === 0) {
      // This is a leaf category
      leafCategories.push(category);
    } else {
      // This category has children, recursively find leaves
      category.children.forEach((child: Category) => findLeaves(child));
    }
  };
  
  // Find the starting category
  const findCategoryById = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) {
        return cat;
      }
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const startCategory = findCategoryById(categories, categoryId);
  if (startCategory) {
    findLeaves(startCategory);
  }
  
  return leafCategories;
};

/**
 * Check if a category is a leaf category (has no children)
 */
export const isLeafCategory = (categories: Category[], categoryId: string): boolean => {
  const findCategory = (cats: Category[], id: string): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) {
        return cat;
      }
      if (cat.children) {
        const found = findCategory(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  const category = findCategory(categories, categoryId);
  return !!(category && (!category.children || category.children.length === 0));
};