/** Admin category (GET /admin/categories). */
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  position: number;
  isActive: boolean;
  /** Products assigned to this category directly (any status). */
  productCount: number;
  publishedProductCount: number;
  updatedAt: string;
}
