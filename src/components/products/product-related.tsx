import { ProductCard } from "./product-card";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  category?: { name: string; slug: string } | null;
  productImages?: { path: string; sortOrder: number }[];
}

interface ProductRelatedProps {
  products: RelatedProduct[];
}

export function ProductRelated({ products }: ProductRelatedProps) {
  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-heading font-bold">Related Products</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
