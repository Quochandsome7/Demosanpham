import type { Env } from "../types";

// ─── Hằng số ────────────────────────────────────────────────────────────────

/** Các loại sự kiện được phép ghi */
export const ALLOWED_EVENTS = [
  "page_view",
  "product_view",
  "search",
  "add_to_cart",
  "begin_checkout",
  "purchase",
] as const;

export type AnalyticsEvent = (typeof ALLOWED_EVENTS)[number];

/** Số ngày giữ dữ liệu; bản ghi cũ hơn sẽ bị xóa */
export const RETENTION_DAYS = 30;

export interface ClientInfo {
  device: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  os: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function isAllowedEvent(event: unknown): event is AnalyticsEvent {
  return typeof event === "string" && (ALLOWED_EVENTS as readonly string[]).includes(event);
}

/** Chỉ nhận đường dẫn nội bộ, bỏ query string, tối đa 200 ký tự */
export function sanitizePath(path: unknown): string | null {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
  return path.split(/[?#]/)[0].slice(0, 200);
}

/** Rút gọn referrer về tên miền; trống hoặc cùng tên miền với website → "Direct" */
export function sanitizeReferrer(referrer: unknown, ownHost: string | null): string {
  if (typeof referrer !== "string" || !referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || host === ownHost) return "Direct";
    return host.slice(0, 100);
  } catch {
    return "Direct";
  }
}

/** Nhận diện thiết bị, trình duyệt, hệ điều hành từ User-Agent */
export function parseUserAgent(userAgent: string): ClientInfo {
  const ua = userAgent || "";

  let os = "Khác";
  if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/.test(ua)) os = "macOS";
  else if (/CrOS/.test(ua)) os = "ChromeOS";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "Khác";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/CocCoc/.test(ua)) browser = "Cốc Cốc";
  else if (/SamsungBrowser/.test(ua)) browser = "Samsung Internet";
  else if (/Firefox|FxiOS/.test(ua)) browser = "Firefox";
  else if (/Chrome|CriOS/.test(ua)) browser = "Chrome";
  else if (/Safari/.test(ua)) browser = "Safari";

  let device: ClientInfo["device"] = "Desktop";
  if (/iPad|Tablet/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) device = "Tablet";
  else if (/Mobi|iPhone|iPod|Android/.test(ua)) device = "Mobile";

  return { device, browser, os };
}

// ─── Ghi sự kiện ────────────────────────────────────────────────────────────

export interface EventRow {
  event: AnalyticsEvent;
  path: string;
  referrer: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  country: string | null;
  city: string | null;
  visitorId: string | null;
  userId: number | null;
  productId: number | null;
}

/** Ghi sự kiện và dọn bản ghi quá hạn trong cùng một batch */
export async function recordEvent(env: Env, row: EventRow): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO analytics_events
       (event, path, referrer, device, browser, os, ip, country, city, visitor_id, user_id, product_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      row.event, row.path, row.referrer, row.device, row.browser, row.os,
      row.ip, row.country, row.city, row.visitorId, row.userId, row.productId,
    ),
    env.DB.prepare(
      `DELETE FROM analytics_events WHERE created_at < datetime('now', ?)`,
    ).bind(`-${RETENTION_DAYS} days`),
  ]);
}

// ─── Thống kê ───────────────────────────────────────────────────────────────

export interface CountRow {
  key: string;
  count: number;
}

/** Thống kê sự kiện trong `hours` giờ gần nhất (tối đa RETENTION_DAYS) */
export async function getStats(env: Env, hours: number) {
  const since = `-${hours} hours`;
  const where = `WHERE created_at >= datetime('now', ?1)`;

  // Đếm theo một cột, số "người" = số visitor_id khác nhau
  const groupBy = (col: string, filter = "", limit = 10) =>
    env.DB.prepare(
      `SELECT COALESCE(${col}, 'Không rõ') AS key, COUNT(DISTINCT COALESCE(visitor_id, ip)) AS count
       FROM analytics_events ${where} ${filter}
       GROUP BY key ORDER BY count DESC LIMIT ${limit}`,
    ).bind(since);

  const [totals, byEvent, byCountry, byCity, byDevice, byOs, byBrowser, byReferrer, topPages, topProducts, byHour] =
    await env.DB.batch([
      env.DB.prepare(
        `SELECT COUNT(DISTINCT COALESCE(visitor_id, ip)) AS visitors,
                COUNT(DISTINCT ip) AS ips,
                SUM(event = 'page_view') AS page_views,
                COUNT(*) AS events
         FROM analytics_events ${where}`,
      ).bind(since),
      env.DB.prepare(
        `SELECT event AS key, COUNT(*) AS count FROM analytics_events ${where}
         GROUP BY event ORDER BY count DESC`,
      ).bind(since),
      groupBy("country"),
      groupBy("city"),
      groupBy("device"),
      groupBy("os"),
      groupBy("browser"),
      groupBy("referrer"),
      env.DB.prepare(
        `SELECT path AS key, COUNT(*) AS count FROM analytics_events ${where} AND event = 'page_view'
         GROUP BY path ORDER BY count DESC LIMIT 10`,
      ).bind(since),
      env.DB.prepare(
        `SELECT COALESCE(p.name, '#' || e.product_id) AS key, COUNT(*) AS count
         FROM analytics_events e LEFT JOIN products p ON p.id = e.product_id
         WHERE e.created_at >= datetime('now', ?1) AND e.event = 'product_view'
         GROUP BY e.product_id ORDER BY count DESC LIMIT 10`,
      ).bind(since),
      env.DB.prepare(
        `SELECT strftime('%Y-%m-%d %H:00', created_at) AS key, COUNT(DISTINCT COALESCE(visitor_id, ip)) AS count
         FROM analytics_events ${where} GROUP BY key ORDER BY key`,
      ).bind(since),
    ]);

  const rows = (r: D1Result) => (r.results as unknown as CountRow[]) ?? [];
  const t = (totals.results?.[0] ?? {}) as Record<string, number | null>;

  return {
    hours,
    totals: {
      visitors: t.visitors ?? 0,
      ips: t.ips ?? 0,
      page_views: t.page_views ?? 0,
      events: t.events ?? 0,
    },
    byEvent: rows(byEvent),
    byCountry: rows(byCountry),
    byCity: rows(byCity),
    byDevice: rows(byDevice),
    byOs: rows(byOs),
    byBrowser: rows(byBrowser),
    byReferrer: rows(byReferrer),
    topPages: rows(topPages),
    topProducts: rows(topProducts),
    byHour: rows(byHour),
  };
}
