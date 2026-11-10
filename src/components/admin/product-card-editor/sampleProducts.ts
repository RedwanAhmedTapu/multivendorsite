// components/admin/product-card-editor/sampleProducts.ts
//
// Fixed preview products for the product card editor. Same input shape the
// listings pass to SharedProductCard (lib/product-card/model.ts), so the
// preview goes through the real adapter. Images are local /public files.
// Preview only — these products don't exist; card links and the cart button
// do nothing in the preview. Covers: discount + rating, regular price, no
// image, several variants (the card shows and adds its cheapest variant) and
// out of stock.
import type { CardProductInput } from "@/lib/product-card/model";

const vendor = { id: "preview-vendor", storeName: "FinixMart Store", verificationStatus: "VERIFIED" };

export interface SampleProduct {
  label: string;
  product: CardProductInput;
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    label: "Discounted, rated",
    product: {
      id: "preview-1",
      slug: "preview-ultrabook",
      name: "Dual Screen Ultrabook 15.6 inch, 32GB RAM, 1TB SSD",
      images: [{ url: "/products/2-75.webp", altText: "Dual screen ultrabook" }],
      variants: [{ id: "pv1", price: 145000, specialPrice: 128900, discount: 11, stock: 12, reservedQty: 0, damagedQty: 0 }],
      vendor,
      avgRating: 4.5,
      reviewCount: 128,
      offerProducts: [{ offer: { type: "FREE_SHIPPING" } }],
    },
  },
  {
    label: "Regular price",
    product: {
      id: "preview-2",
      slug: "preview-food-processor",
      name: "Food Processor 2.1 L with 3 Speed Settings",
      images: [{ url: "/products/1-103.webp", altText: "Food processor" }],
      variants: [{ id: "pv2", price: 18500, specialPrice: null, discount: 0, stock: 8, reservedQty: 0, damagedQty: 0 }],
      vendor,
      avgRating: 4,
      reviewCount: 9,
    },
  },
  {
    label: "No image",
    product: {
      id: "preview-3",
      slug: "preview-no-image",
      name: "Product Without an Image",
      images: [],
      variants: [{ id: "pv3", price: 2400, specialPrice: 1990, discount: 17, stock: 3, reservedQty: 0, damagedQty: 0 }],
      vendor: { id: "preview-vendor-2", storeName: "Sample Seller", verificationStatus: "PENDING" },
      avgRating: 0,
      reviewCount: 0,
    },
  },
  {
    label: "Several options",
    product: {
      id: "preview-4",
      slug: "preview-several-options",
      name: "Wireless Charging Pad, 3 Power Options",
      images: [{ url: "/products/1-80.webp", altText: "Wireless charging pad" }],
      variants: [
        { id: "pv4a", price: 1450, specialPrice: null, discount: 0, stock: 20, reservedQty: 0, damagedQty: 0 },
        { id: "pv4b", price: 1650, specialPrice: null, discount: 0, stock: 6, reservedQty: 0, damagedQty: 0 },
        { id: "pv4c", price: 1850, specialPrice: null, discount: 0, stock: 0, reservedQty: 0, damagedQty: 0 },
      ],
      vendor,
      avgRating: 3.5,
      reviewCount: 4,
    },
  },
  {
    label: "Out of stock",
    product: {
      id: "preview-5",
      slug: "preview-out-of-stock",
      name: "Retro Blender 1.5 L",
      images: [{ url: "/products/1-9.webp", altText: "Retro blender" }],
      variants: [{ id: "pv5", price: 990, specialPrice: 850, discount: 14, stock: 3, reservedQty: 2, damagedQty: 1 }],
      vendor,
      avgRating: 0,
      reviewCount: 0,
    },
  },
];
