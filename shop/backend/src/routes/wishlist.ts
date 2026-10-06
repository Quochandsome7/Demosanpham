import { Hono } from 'hono';
import type { Env } from '../types';

const wishlist = new Hono<{ Bindings: Env }>();

// GET / — get wishlist for session
wishlist.get('/', async (c) => {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) {
    return c.json({ success: true, data: [] });
  }

  const { results } = await c.env.DB.prepare(`
    SELECT w.id, w.product_id, w.created_at,
           p.name, p.price, p.original_price, p.image_url, p.badge, p.chip, p.specs, p.stock,
           c.name as category_name
    FROM wishlist_items w
    JOIN products p ON w.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE w.session_id = ? AND p.is_active = 1
    ORDER BY w.created_at DESC
  `).bind(sessionId).all<any>();

  const formatted = results.map(p => ({
    ...p,
    specs: p.specs ? (() => { try { return JSON.parse(p.specs); } catch { return []; } })() : []
  }));

  return c.json({ success: true, data: formatted });
});

// POST / — add product to wishlist
wishlist.post('/', async (c) => {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) {
    return c.json({ success: false, error: 'Session ID required' }, 400);
  }

  const body = await c.req.json();
  const { product_id } = body;

  if (!product_id) {
    return c.json({ success: false, error: 'product_id required' }, 400);
  }

  // Check product exists
  const product = await c.env.DB.prepare(
    'SELECT id FROM products WHERE id = ? AND is_active = 1'
  ).bind(product_id).first();

  if (!product) {
    return c.json({ success: false, error: 'Product not found' }, 404);
  }

  // Upsert (ignore if already exists)
  await c.env.DB.prepare(`
    INSERT OR IGNORE INTO wishlist_items (session_id, product_id) VALUES (?, ?)
  `).bind(sessionId, product_id).run();

  return c.json({ success: true, message: 'Added to wishlist' });
});

// DELETE /:productId — remove from wishlist
wishlist.delete('/:productId', async (c) => {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) {
    return c.json({ success: false, error: 'Session ID required' }, 400);
  }

  const productId = c.req.param('productId');

  await c.env.DB.prepare(
    'DELETE FROM wishlist_items WHERE session_id = ? AND product_id = ?'
  ).bind(sessionId, productId).run();

  return c.json({ success: true, message: 'Removed from wishlist' });
});

// GET /check/:productId — check if product is in wishlist
wishlist.get('/check/:productId', async (c) => {
  const sessionId = c.req.header('x-session-id');
  if (!sessionId) {
    return c.json({ success: true, data: { inWishlist: false } });
  }

  const productId = c.req.param('productId');

  const item = await c.env.DB.prepare(
    'SELECT id FROM wishlist_items WHERE session_id = ? AND product_id = ?'
  ).bind(sessionId, productId).first();

  return c.json({ success: true, data: { inWishlist: !!item } });
});

export default wishlist;
