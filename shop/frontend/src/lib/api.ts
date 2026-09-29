const isBrowser = typeof window !== "undefined";
const API_BASE =
  isBrowser &&
  (window.location.hostname.includes("pages.dev") ||
    window.location.hostname !== "localhost")
    ? "https://demosanpham.dtc235200623.workers.dev/api/v1"
    : "/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };

  // Add auth token if exists
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("admin_token")
      : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Session ID for cart (persists across cross-domain requests)
  if (typeof localStorage !== "undefined") {
    let cartSession = localStorage.getItem("cart_session_id");
    if (!cartSession) {
      cartSession = "sess_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("cart_session_id", cartSession);
    }
    headers["x-session-id"] = cartSession;
  }

  // Add content-type for JSON bodies
  if (options?.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers, credentials: "include" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Products
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any>(`/products${qs}`);
  },
  getProduct: (id: number) => request<any>(`/products/${id}`),
  createProduct: (data: any) =>
    request<any>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: any) =>
    request<any>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: number) =>
    request<any>(`/products/${id}`, { method: "DELETE" }),

  // Categories
  getCategories: () => request<any>("/categories"),
  createCategory: (data: any) =>
    request<any>("/categories", { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (id: number, data: any) =>
    request<any>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: number) =>
    request<any>(`/categories/${id}`, { method: "DELETE" }),

  // Cart
  getCart: () => request<any>("/cart"),
  addToCart: (product_id: number, quantity: number = 1) =>
    request<any>("/cart", {
      method: "POST",
      body: JSON.stringify({ product_id, quantity }),
    }),
  updateCartItem: (itemId: number, quantity: number) =>
    request<any>(`/cart/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (itemId: number) =>
    request<any>(`/cart/${itemId}`, { method: "DELETE" }),

  // Orders
  getOrders: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any>(`/orders${qs}`);
  },
  getOrder: (id: number) => request<any>(`/orders/${id}`),
  createOrder: (data: any) =>
    request<any>("/orders", { method: "POST", body: JSON.stringify(data) }),
  updateOrder: (id: number, data: any) =>
    request<any>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Customers
  getCustomers: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<any>(`/customers${qs}`);
  },
  getCustomer: (id: number) => request<any>(`/customers/${id}`),

  // Admin Auth
  login: (username: string, password: string) =>
    request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => request<any>("/auth/me"),

  // Customer Auth
  customerRegister: (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    address?: string;
  }) =>
    request<any>("/customer-auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  customerLogin: (data: { identifier: string; password: string }) =>
    request<any>("/customer-auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getCustomerMe: () => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("customer_token")
        : null;
    return request<any>("/customer-auth/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  updateCustomerMe: (data: any) => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("customer_token")
        : null;
    return request<any>("/customer-auth/me", {
      method: "PUT",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    });
  },

  // Upload
  uploadImage: (url: string) =>
    request<any>("/upload", { method: "POST", body: JSON.stringify({ url }) }),
};
