export interface ChatSource {
  product_id: number;
  slug?: string;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  stock: number;
  badge?: string | null;
  category_name?: string | null;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}
