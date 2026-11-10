// components/seo/CategorySeoContent.tsx
import { Category } from "@/types/category.types";

interface CategorySeoContentProps {
  category: Category;
  productCount: number;
  siteName?: string;
}

export const CategorySeoContent: React.FC<CategorySeoContentProps> = ({
  category,
  productCount,
  siteName = "Our Store",
}) => {
  const getCategoryDescription = () => {
    const categoryName = category.name.toLowerCase();
    
    return `Discover our extensive collection of ${categoryName} at ${siteName}. ` +
      `Browse through ${productCount}+ ${categoryName} products at competitive prices. ` +
      `Enjoy fast delivery across Bangladesh, easy returns, and secure payment options. ` +
      `Find the best deals on ${categoryName} with exclusive discounts and offers.`;
  };

  return (
    <div className="mb-8 p-6 bg-white rounded-xl border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-3">
        Shop {category.name} Online in Bangladesh
      </h2>
      <p className="text-gray-600 leading-relaxed">
        {getCategoryDescription()}
      </p>
      
      {/* Related category links for internal linking */}
      {category.children && category.children.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Browse {category.name} Subcategories:
          </h3>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <a
                key={child.id}
                href={`/products?category=${child.slug}`}
                className="text-sm text-teal-600 hover:text-teal-700 hover:underline"
              >
                {child.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};