import { writable, derived } from "svelte/store";
import { api } from "../api";

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
  product: {
    id: number;
    name: string;
    price: number;
    image_url: string;
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
}

function getCachedItems(): CartItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem('cart_items_cache');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedItems(items: CartItem[]) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem('cart_items_cache', JSON.stringify(items));
  } catch {}
}

const initialState: CartState = {
  items: getCachedItems(),
  loading: false,
  error: null,
};

function normalizeItem(raw: any): CartItem {
  const price = raw.product?.price ?? raw.price ?? 0;
  const name = raw.product?.name ?? raw.name ?? "Sản phẩm";
  const image_url = raw.product?.image_url ?? raw.image_url ?? "";
  const product_id = raw.product_id ?? raw.id ?? 0;
  const id = raw.cart_item_id ?? raw.id ?? product_id;

  return {
    id,
    product_id,
    quantity: raw.quantity || 1,
    name,
    price,
    image_url,
    product: {
      id: product_id,
      name,
      price,
      image_url,
    },
  };
}

function createCartStore() {
  const { subscribe, set, update } = writable<CartState>(initialState);

  return {
    subscribe,
    loadCart: async () => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await api.getCart();
        const rawItems = res.data || [];
        const items = rawItems.map(normalizeItem);
        saveCachedItems(items);
        update((s) => ({ ...s, items, loading: false }));
      } catch (err: any) {
        update((s) => ({ ...s, error: err.message, loading: false }));
      }
    },
    addItem: async (product_id: number, quantity: number = 1) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        await api.addToCart(product_id, quantity);
        const res = await api.getCart();
        const rawItems = res.data || [];
        const items = rawItems.map(normalizeItem);
        saveCachedItems(items);
        update((s) => ({ ...s, items, loading: false }));
      } catch (err: any) {
        update((s) => ({ ...s, error: err.message, loading: false }));
      }
    },
    updateItem: async (itemId: number, quantity: number) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        await api.updateCartItem(itemId, quantity);
        const res = await api.getCart();
        const rawItems = res.data || [];
        const items = rawItems.map(normalizeItem);
        saveCachedItems(items);
        update((s) => ({ ...s, items, loading: false }));
      } catch (err: any) {
        update((s) => ({ ...s, error: err.message, loading: false }));
      }
    },
    removeItem: async (itemId: number) => {
      update((s) => ({ ...s, loading: true, error: null }));
      try {
        await api.removeCartItem(itemId);
        const res = await api.getCart();
        const rawItems = res.data || [];
        const items = rawItems.map(normalizeItem);
        saveCachedItems(items);
        update((s) => ({ ...s, items, loading: false }));
      } catch (err: any) {
        update((s) => ({ ...s, error: err.message, loading: false }));
      }
    },
    clear: () => {
      saveCachedItems([]);
      set({ items: [], loading: false, error: null });
    },
  };
}

export const cart = createCartStore();

export const cartTotal = derived(cart, ($cart) => {
  return $cart.items.reduce((total, item) => {
    const p = item.product?.price ?? item.price ?? 0;
    return total + p * (item.quantity || 1);
  }, 0);
});

export const cartCount = derived(cart, ($cart) => {
  return $cart.items.reduce((count, item) => count + (item.quantity || 1), 0);
});
