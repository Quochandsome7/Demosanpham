import { writable, derived } from "svelte/store";
import { api } from "../api";

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
  stock?: number;
  stock_quantity?: number;
  image_url: string;
  badge?: string;
  chip?: string;
  specs?: any;
  status?: string;
  is_active?: boolean;
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
  error: null,
};

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function matchText(text: string | null | undefined, q: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  if (t.includes(query)) return true;
  return removeVietnameseTones(t).includes(removeVietnameseTones(query));
}

// Standalone writable store for search query: avoids any loop or mutation issues
export const searchQuery = writable<string>("");

function createProductsStore() {
  const { subscribe, set, update } = writable<ProductsState>(initialState);

  return {
    subscribe,
    set,
    update,
    loadProducts: async (params?: Record<string, string>) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.getProducts(params);
        update((s) => ({ ...s, products: res.data || [], loading: false }));
      } catch (err: any) {
        update((s) => ({ ...s, error: err.message, loading: false }));
      }
    },
    loadCategories: async () => {
      try {
        const res = await api.getCategories();
        update((s) => ({ ...s, categories: res.data || [] }));
      } catch (err: any) {
        console.error("Failed to load categories", err);
      }
    },
    setCategory: (categoryId: number | null) => {
      update((s) => ({ ...s, selectedCategory: categoryId }));
    },
    setSearchQuery: (query: string) => {
      searchQuery.set(query);
    },
    clearSearch: () => {
      searchQuery.set("");
    },
  };
}

export const productsStore = createProductsStore();

export const filteredProducts = derived(
  [productsStore, searchQuery],
  ([$store, $query]) => {
    let list = $store.products;

    // Filter by search query if present (supports Vietnamese with and without accents)
    const q = $query.trim();
    if (q !== "") {
      list = list.filter((p) => {
        const matchName = matchText(p.name, q);
        const matchChip = matchText(p.chip, q);
        const matchBadge = matchText(p.badge, q);
        const matchDesc = matchText(p.description, q);
        const matchSpecs =
          p.specs && Array.isArray(p.specs)
            ? p.specs.some(
                (s: string) => typeof s === "string" && matchText(s, q),
              )
            : false;
        return matchName || matchChip || matchBadge || matchDesc || matchSpecs;
      });
    }

    // Filter by category if selected
    if ($store.selectedCategory !== null) {
      list = list.filter((p) => p.category_id === $store.selectedCategory);
    }

    return list;
  }
);

