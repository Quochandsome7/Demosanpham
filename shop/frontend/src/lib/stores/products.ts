import { writable, derived } from 'svelte/store';
import { api } from '../api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  image_url: string;
  badge?: string;
  specs?: any;
  status: string;
}

interface ProductsState {
  products: Product[];
  categories: Category[];
  loading: boolean;
  selectedCategory: number | null;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  categories: [],
  loading: false,
  selectedCategory: null,
  error: null
};

function createProductsStore() {
  const { subscribe, set, update } = writable<ProductsState>(initialState);

  return {
    subscribe,
    loadProducts: async (params?: Record<string, string>) => {
      update(s => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.getProducts(params);
        update(s => ({ ...s, products: res.data || [], loading: false }));
      } catch (err: any) {
        update(s => ({ ...s, error: err.message, loading: false }));
      }
    },
    loadCategories: async () => {
      try {
        const res = await api.getCategories();
        update(s => ({ ...s, categories: res.data || [] }));
      } catch (err: any) {
        console.error('Failed to load categories', err);
      }
    },
    setCategory: (categoryId: number | null) => {
      update(s => ({ ...s, selectedCategory: categoryId }));
    }
  };
}

export const productsStore = createProductsStore();

export const filteredProducts = derived(productsStore, ($store) => {
  if ($store.selectedCategory === null) {
    return $store.products;
  }
  return $store.products.filter(p => p.category_id === $store.selectedCategory);
});
