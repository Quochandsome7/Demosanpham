import { writable } from "svelte/store";
import { API_BASE, isBrowser } from "./api";

export type ShopEvent =
  | "page_view"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase";

const OPT_OUT_KEY = "analytics_opt_out";
const VISITOR_KEY = "visitor_id";

function readOptOut(): boolean {
  try {
    return isBrowser && localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

/** true nếu khách đã tắt thống kê trên trình duyệt này */
export const analyticsOptOut = writable(readOptOut());

export function setAnalyticsOptOut(value: boolean) {
  try {
    if (value) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
  analyticsOptOut.set(value);
}

function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Gửi một sự kiện thống kê; không bao giờ ném lỗi ra ngoài */
export function trackShop(event: ShopEvent, extra: { product_id?: number } = {}) {
  if (!isBrowser || readOptOut()) return;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const token = localStorage.getItem("customer_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch {}

  fetch(`${API_BASE}/analytics/event`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event,
      path: location.pathname,
      referrer: document.referrer,
      visitor_id: getVisitorId(),
      ...extra,
    }),
    keepalive: true,
  }).catch(() => {});
}

let searchTimer: ReturnType<typeof setTimeout> | undefined;
let lastSearch = "";

/** Ghi sự kiện tìm kiếm sau 1 giây kể từ lần gõ cuối */
export function trackSearch(query: string) {
  clearTimeout(searchTimer);
  const q = query.trim();
  if (!q) return;
  searchTimer = setTimeout(() => {
    if (q === lastSearch) return;
    lastSearch = q;
    trackShop("search");
  }, 1000);
}
