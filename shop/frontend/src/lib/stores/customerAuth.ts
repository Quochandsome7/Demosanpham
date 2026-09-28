import { writable } from "svelte/store";
import { api } from "../api";

export interface CustomerUser {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
}

interface CustomerAuthState {
  user: CustomerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: CustomerAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

function createCustomerAuthStore() {
  const { subscribe, set, update } = writable<CustomerAuthState>(initialState);

  return {
    subscribe,

    checkAuth: async () => {
      if (typeof localStorage === "undefined") return;
      const token = localStorage.getItem("customer_token");
      const savedUser = localStorage.getItem("customer_user");

      if (!token) {
        set(initialState);
        return;
      }

      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          set({ user, token, isAuthenticated: true, loading: false });
        } catch {
          // fallback
        }
      }

      try {
        const res = await api.getCustomerMe();
        if (res.success && res.data) {
          localStorage.setItem("customer_user", JSON.stringify(res.data));
          set({
            user: res.data,
            token,
            isAuthenticated: true,
            loading: false,
          });
        }
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
        set(initialState);
      }
    },

    login: async (identifier: string, password: string) => {
      update((s) => ({ ...s, loading: true }));
      try {
        const res = await api.customerLogin({ identifier, password });
        if (res.success && res.data) {
          const { token, user } = res.data;
          localStorage.setItem("customer_token", token);
          localStorage.setItem("customer_user", JSON.stringify(user));
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true, user };
        }
        throw new Error(res.error || "Đăng nhập không thành công");
      } catch (err: any) {
        update((s) => ({ ...s, loading: false }));
        throw err;
      }
    },

    register: async (data: {
      name: string;
      phone: string;
      email?: string;
      password: string;
      address?: string;
    }) => {
      update((s) => ({ ...s, loading: true }));
      try {
        const res = await api.customerRegister(data);
        if (res.success && res.data) {
          const { token, user } = res.data;
          localStorage.setItem("customer_token", token);
          localStorage.setItem("customer_user", JSON.stringify(user));
          set({ user, token, isAuthenticated: true, loading: false });
          return { success: true, user };
        }
        throw new Error(res.error || "Đăng ký không thành công");
      } catch (err: any) {
        update((s) => ({ ...s, loading: false }));
        throw err;
      }
    },

    logout: () => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem("customer_token");
        localStorage.removeItem("customer_user");
      }
      set(initialState);
    },
  };
}

export const customerAuth = createCustomerAuthStore();
