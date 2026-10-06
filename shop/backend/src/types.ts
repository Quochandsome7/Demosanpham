export interface Env {
  DB: D1Database;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  JWT_SECRET: string;
  FRONTEND_URL: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  description: string | null;
  category_id: number | null;
  rating: number;
  reviews: number;
  badge: string | null;
  chip: string | null;
  specs: string | null;
  stock: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  password_hash?: string | null;
  created_at: string;
}

export interface Order {
  id: number;
  customer_id: number | null;
  status: string;
  total: number;
  payment_method?: string | null;
  bank_or_wallet?: string | null;
  shipping_address: string | null;
  phone: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number | null;
  product_id: number | null;
  quantity: number;
  price: number;
}

export interface CartItem {
  id: number;
  session_id: string;
  product_id: number | null;
  quantity: number;
  created_at: string;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: any;
};
