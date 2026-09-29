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
  searchQuery: string;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  categories: [],
  loading: false,
  selectedCategory: null,
  searchQuery: "",
  error: null,
};

function createProductsStore() {
  const { subscribe, set, update } = writable<ProductsState>(initialState);

  return {
    subscribe,
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
      update((s) => ({ ...s, searchQuery: query }));
    },
    clearSearch: () => {
      update((s) => ({ ...s, searchQuery: "" }));
    },
  };
}

export const productsStore = createProductsStore();

export const filteredProducts = derived(productsStore, ($store) => {
  let list = $store.products;

  // Filter by category
  if ($store.selectedCategory !== null) {
    list = list.filter((p) => p.category_id === $store.selectedCategory);
  }

  // Filter by search query
  if ($store.searchQuery && $store.searchQuery.trim() !== "") {
    const q = $store.searchQuery.toLowerCase().trim();
    list = list.filter((p) => {
      const matchName = p.name ? p.name.toLowerCase().includes(q) : false;
      const matchChip = p.chip ? p.chip.toLowerCase().includes(q) : false;
      const matchBadge = p.badge ? p.badge.toLowerCase().includes(q) : false;
      const matchDesc = p.description
        ? p.description.toLowerCase().includes(q)
        : false;
      const matchSpecs =
        p.specs && Array.isArray(p.specs)
          ? p.specs.some(
              (s: string) =>
                typeof s === "string" && s.toLowerCase().includes(q),
            )
          : false;
      return matchName || matchChip || matchBadge || matchDesc || matchSpecs;
    });
  }

  return list;
});
