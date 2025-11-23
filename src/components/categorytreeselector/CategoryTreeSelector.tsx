"use client";
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, Search, X } from 'lucide-react';
import { useGetCategoriesQuery } from '@/features/apiSlice';
import { Category } from '@/types/type';

interface Props {
  onSelect: (id: string, path: string, isLeaf: boolean, attributes: any[], specifications: any[]) => void;
}

const CategoryTreeSelectorItem: React.FC<{
  category: Category;
  selectedCategoryId?: string | null;
  onSelectCategory: (id: string, path: string, isLeaf: boolean, attributes: any[], specifications: any[]) => void;
  parentPath?: string;
  searchQuery?: string;
}> = ({ category, selectedCategoryId, onSelectCategory, parentPath = '', searchQuery = '' }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = Array.isArray(category.children) && category.children.length > 0;
  const isLeaf = !hasChildren;
  const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name;

  const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase());
  const childMatchesSearch =
    hasChildren &&
    category.children?.some((child: Category) =>
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  React.useEffect(() => {
    if (searchQuery && (matchesSearch || childMatchesSearch)) {
      setOpen(true);
    }
  }, [searchQuery, matchesSearch, childMatchesSearch]);

  if (searchQuery && !matchesSearch && !childMatchesSearch) {
    return null;
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded text-xs hover:bg-gray-100 transition-colors ${
          selectedCategoryId === category.id
            ? 'bg-teal-50 border-l-2 border-teal-500 text-teal-800 font-medium'
            : ''
        }`}
        onClick={() =>
          onSelectCategory(category.id, currentPath, isLeaf, category.attributes || [], category.specifications || [])
        }
      >
        <button
          className='p-0.5 hover:bg-gray-200 rounded'
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setOpen(!open);
          }}
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className='h-3 w-3 text-gray-600' />
            ) : (
              <ChevronRight className='h-3 w-3 text-gray-600' />
            )
          ) : (
            <div className='w-3 h-3' />
          )}
        </button>
        <Folder className='h-3 w-3 text-gray-500 flex-shrink-0' />
        <span className='flex-1 truncate'>{category.name}</span>
        {isLeaf && (
          <span className='text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded'>Leaf</span>
        )}
        {hasChildren && (
          <span className='text-[10px] bg-gray-100 text-gray-600 px-1 py-0.5 rounded'>
            {category.children?.length}
          </span>
        )}
      </div>
      {hasChildren && open && (
        <div className='ml-4 mt-0.5 border-l-2 border-gray-200 pl-1'>
          {category.children?.map((child) => (
            <CategoryTreeSelectorItem
              key={child.id}
              category={child}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
              parentPath={currentPath}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoryTreeSelector({ onSelect }: Props) {
  const { data: categories, isLoading } = useGetCategoriesQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [isLeafCategory, setIsLeafCategory] = useState<boolean>(false);
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([]);
  const [categorySpecifications, setCategorySpecifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  const handleSelectCategory = (
    id: string,
    path: string,
    isLeaf: boolean,
    attributes: any[],
    specifications: any[]
  ) => {
    setSelectedId(id);
    setSelectedPath(path);
    setIsLeafCategory(isLeaf);
    setCategoryAttributes(attributes);
    setCategorySpecifications(specifications);
    onSelect(id, path, isLeaf, attributes, specifications);
  };

  const handleClearSelection = () => {
    setSelectedId(null);
    setSelectedPath('');
    setIsLeafCategory(false);
    setCategoryAttributes([]);
    setCategorySpecifications([]);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className='space-y-3'>
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-semibold text-gray-900'>Select Category</h3>
          {categories && (
            <span className='text-xs text-gray-500'>{categories.length} categories</span>
          )}
        </div>
        <div className='relative'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='Search categories...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className='absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>
      </div>
      {selectedId && (
        <div className='p-2.5 border border-teal-200 rounded-lg bg-teal-50'>
          <div className='flex items-start justify-between gap-2'>
            <div className='flex-1 min-w-0'>
              <p className='text-xs font-medium text-teal-900 truncate'>{selectedPath}</p>
              <div className='flex items-center gap-2 mt-1'>
                {isLeafCategory ? (
                  <span className='text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium'>
                    ✓ Leaf Category
                  </span>
                ) : (
                  <span className='text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium'>
                    ⚠ Has Subcategories
                  </span>
                )}
                {categoryAttributes.length > 0 && (
                  <span className='text-[10px] text-gray-600'>
                    {categoryAttributes.length} attributes
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className='text-teal-600 hover:text-teal-800 p-1'
              title='Clear selection'
            >
              <X className='h-3.5 w-3.5' />
            </button>
          </div>
        </div>
      )}
      <div className='border border-gray-200 rounded-lg overflow-hidden'>
        <div className='bg-gray-50 px-3 py-2 border-b border-gray-200 flex items-center justify-between'>
          <span className='text-xs font-medium text-gray-700'>Categories</span>
          {searchQuery && (
            <span className='text-xs text-gray-500'>Search: "{searchQuery}"</span>
          )}
        </div>
        <div className='max-h-72 overflow-y-auto p-2 space-y-0.5'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin' />
              <span className='ml-2 text-sm text-gray-600'>Loading categories...</span>
            </div>
          ) : categories && categories.length > 0 ? (
            categories.map((cat) => (
              <CategoryTreeSelectorItem
                key={cat.id}
                category={cat}
                selectedCategoryId={selectedId}
                onSelectCategory={handleSelectCategory}
                searchQuery={searchQuery}
              />
            ))
          ) : (
            <div className='text-center py-8 text-sm text-gray-500'>
              {searchQuery ? 'No categories found' : 'No categories available'}
            </div>
          )}
        </div>
      </div>
      {selectedId && !isLeafCategory && (
        <div className='flex items-start gap-2 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <span className='text-yellow-600 text-xs mt-0.5'>⚠️</span>
          <p className='text-xs text-yellow-800'>
            Please select a leaf category (one without subcategories) to continue.
          </p>
        </div>
      )}
    </div>
  );
}