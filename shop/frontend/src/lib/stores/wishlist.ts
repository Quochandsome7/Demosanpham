import { writable, derived } from "svelte/store";
import { api } from "../api";

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  original_price?: number;
  image_url?: string;
  badge?: string;
  chip?: string;
  specs?: string[];
  stock: number;
  category_name?: string;
  stock_quantity?: number;
}

interface WishlistState {
  items: WishlistItem[];
  loading: boolean;
  productIds: Set<number>;
}

function createWishlistStore() {
  const { subscribe, set, update } = writable<WishlistState>({
    items: [],
    loading: false,
    productIds: new Set(),
  });

  return {
    subscribe,
    loadWishlist: async () => {
      update((s) => ({ ...s, loading: true }));
      try {
        const data = await api.getWishlist();
        const items = data.data || [];
        update((s) => ({
          ...s,
          items,
          productIds: new Set(items.map((i: WishlistItem) => i.product_id)),
          loading: false,
        }));
      } catch {
        update((s) => ({ ...s, loading: false }));
      }
    },
    addToWishlist: async (productId: number) => {
      // Optimistic update
      update((s) => {
        const newIds = new Set(s.productIds);
        newIds.add(productId);
        return { ...s, productIds: newIds };
      });
      try {
        await api.addToWishlist(productId);
      } catch {
        // Revert on failure
        update((s) => {
          const newIds = new Set(s.productIds);
          newIds.delete(productId);
          return { ...s, productIds: newIds };
        });
      }
    },
    removeFromWishlist: async (productId: number) => {
      // Optimistic update
      update((s) => {
        const newIds = new Set(s.productIds);
        newIds.delete(productId);
        return {
          ...s,
          productIds: newIds,
          items: s.items.filter((i) => i.product_id !== productId),
        };
      });
      try {
        await api.removeFromWishlist(productId);
      } catch {
        // Silently fail - will sync on next load
      }
    },
    toggleWishlist: async (productId: number) => {
      let isInWishlist = false;
      const unsubscribe = wishlistStore.subscribe((s) => {
        isInWishlist = s.productIds.has(productId);
      });
      unsubscribe();

      if (isInWishlist) {
        await wishlistStore.removeFromWishlist(productId);
      } else {
        await wishlistStore.addToWishlist(productId);
      }
    },
    isInWishlist: (productId: number): boolean => {
      let result = false;
      const unsub = wishlistStore.subscribe((s) => {
        result = s.productIds.has(productId);
      });
      unsub();
      return result;
    },
  };
}

export const wishlistStore = createWishlistStore();
export const wishlistCount = derived(wishlistStore, ($s) => $s.items.length);
