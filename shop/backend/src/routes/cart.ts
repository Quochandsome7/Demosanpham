import { Hono } from 'hono';
import { Env } from '../types';
import { generateSessionId } from '../utils';
import { getCookie, setCookie } from 'hono/cookie';

const cart = new Hono<{ Bindings: Env }>();

// Middleware to ensure session_id
const ensureSession = (c: any, next: any) => {
  let sessionId = getCookie(c, 'session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    setCookie(c, 'session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  c.set('session_id', sessionId);
  return next();
};

cart.use('*', ensureSession);

cart.get('/', async (c) => {
  const sessionId = c.get('session_id');
  
  const { results } = await c.env.DB.prepare(`
    SELECT c.id as cart_item_id, c.quantity, p.* 
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.session_id = ?
  `).bind(sessionId).all();

  return c.json({ success: true, data: results, session_id: sessionId });
});

cart.post('/', async (c) => {
  const sessionId = c.get('session_id');
  const { product_id, quantity = 1 } = await c.req.json();

  if (!product_id) {
    return c.json({ success: false, error: 'Product ID is required' }, 400);
  }

  // Upsert pattern
  const result = await c.env.DB.prepare(`
    INSERT INTO cart_items (session_id, product_id, quantity)
    VALUES (?, ?, ?)
    ON CONFLICT(session_id, product_id) 
    DO UPDATE SET quantity = cart_items.quantity + excluded.quantity
    RETURNING *
  `).bind(sessionId, product_id, quantity).first();

  return c.json({ success: true, data: result });
});

cart.put('/:itemId', async (c) => {
  const sessionId = c.get('session_id');
  const itemId = c.req.param('itemId');
  const { quantity } = await c.req.json();

  if (quantity <= 0) {
    await c.env.DB.prepare(`DELETE FROM cart_items WHERE id = ? AND session_id = ?`).bind(itemId, sessionId).run();
    return c.json({ success: true, message: 'Item removed' });
  }

  const result = await c.env.DB.prepare(`
    UPDATE cart_items SET quantity = ? WHERE id = ? AND session_id = ? RETURNING *
  `).bind(quantity, itemId, sessionId).first();

  if (!result) {
    return c.json({ success: false, error: 'Item not found' }, 404);
  }

  return c.json({ success: true, data: result });
});

cart.delete('/:itemId', async (c) => {
  const sessionId = c.get('session_id');
  const itemId = c.req.param('itemId');

  const result = await c.env.DB.prepare(`DELETE FROM cart_items WHERE id = ? AND session_id = ?`).bind(itemId, sessionId).run();
  
  if (result.meta.changes === 0) {
    return c.json({ success: false, error: 'Item not found' }, 404);
  }

  return c.json({ success: true, message: 'Item removed' });
});

export default cart;
