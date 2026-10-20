import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { verifyJWT } from '../utils';
import type { Env } from '../types';
import {
  RETENTION_DAYS,
  isAllowedEvent,
  sanitizePath,
  sanitizeReferrer,
  parseUserAgent,
  recordEvent,
  getStats,
} from '../lib/analytics';

const analytics = new Hono<{ Bindings: Env }>();

// ─── POST /analytics/event — Ghi một sự kiện truy cập ───────────────────────

analytics.post('/event', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !isAllowedEvent(body.event)) {
    return c.json({ success: false, error: 'Loại sự kiện không hợp lệ' }, 400);
  }

  const path = sanitizePath(body.path);
  if (!path) {
    return c.json({ success: false, error: 'Đường dẫn không hợp lệ' }, 400);
  }

  // Tên miền của website (để coi điều hướng nội bộ là "Direct")
  let ownHost: string | null = null;
  try {
    ownHost = new URL(c.req.header('Origin') || '').hostname.replace(/^www\./, '');
  } catch {}

  // user_id chỉ có khi khách đang đăng nhập (xác minh bằng JWT, không tin client tự khai)
  let userId: number | null = null;
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = await verifyJWT(authHeader.slice(7), c.env.JWT_SECRET);
      if (payload?.id && payload.role === 'customer') userId = Number(payload.id);
    } catch {}
  }

  const cf = (c.req.raw as any).cf as { country?: string; city?: string } | undefined;
  const client = parseUserAgent(c.req.header('User-Agent') || '');
  const productId = Number.isInteger(body.product_id) ? body.product_id : null;
  const visitorId =
    typeof body.visitor_id === 'string' && /^[\w-]{8,64}$/.test(body.visitor_id) ? body.visitor_id : null;

  try {
    await recordEvent(c.env, {
      event: body.event,
      path,
      referrer: sanitizeReferrer(body.referrer, ownHost),
      ...client,
      ip: c.req.header('CF-Connecting-IP') || '',
      country: cf?.country ?? null,
      city: cf?.city ?? null,
      visitorId,
      userId,
      productId,
    });
    return c.json({ success: true });
  } catch (err: any) {
    console.error('[analytics] insert error:', err);
    return c.json({ success: false, error: 'Không ghi được sự kiện' }, 500);
  }
});

// ─── GET /analytics/stats?hours=24 — Thống kê (admin) ───────────────────────

analytics.get('/stats', authMiddleware, async (c) => {
  const hours = Math.min(Math.max(Number(c.req.query('hours')) || 24, 1), RETENTION_DAYS * 24);
  try {
    const data = await getStats(c.env, hours);
    return c.json({ success: true, data });
  } catch (err: any) {
    console.error('[analytics] stats error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default analytics;
