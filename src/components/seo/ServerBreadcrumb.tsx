// components/seo/ServerBreadcrumb.tsx
import Link from "next/link";

function getCategoryPath(categories: any[], target: any, path: any[] = []): any[] {
  for (const cat of categories) {
    if (cat.id === target.id) return [...path, cat];
    if (cat.children?.length) {
      const found = getCategoryPath(cat.children, target, [...path, cat]);
      if (found.length > 0) return found;
    }
  }
  return [];
}

export function ServerBreadcrumb({ categories, currentCategory }: { categories: any[], currentCategory: any }) {
  const path = currentCategory ? getCategoryPath(categories, currentCategory) : [];

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600 mb-4">
      <ol className="flex items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/" itemProp="item" className="hover:text-teal-600">
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        <span>/</span>
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/products" itemProp="item" className={`hover:text-teal-600 ${!currentCategory ? 'text-gray-900 font-medium' : ''}`}>
            <span itemProp="name">Products</span>
          </Link>
          <meta itemProp="position" content="2" />
        </li>
        
        {path.map((cat: any, idx: number) => (
          <span key={cat.id} className="flex items-center gap-2">
            <span>/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link 
                href={`/products?category=${cat.slug}`} 
                itemProp="item" 
                className={idx === path.length - 1 ? 'text-gray-900 font-medium' : 'hover:text-teal-600'}
              >
                <span itemProp="name">{cat.name}</span>
              </Link>
              <meta itemProp="position" content={String(idx + 3)} />
            </li>
          </span>
        ))}
      </ol>
    </nav>
  );
}