import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const customers = new Hono<{ Bindings: Env }>();

customers.get('/', authMiddleware, async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const offset = (page - 1) * limit;

  const query = `
    SELECT c.*, COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c.env.DB.prepare(query).bind(limit, offset).all();

  const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM customers`).first<{total: number}>();
  const total = countResult ? countResult.total : 0;

  return c.json({ 
    success: true, 
    data: results,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

customers.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');

  const customer = await c.env.DB.prepare(`SELECT * FROM customers WHERE id = ?`).bind(id).first();
  if (!customer) {
    return c.json({ success: false, error: 'Customer not found' }, 404);
  }

  const { results: orders } = await c.env.DB.prepare(`
    SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC
  `).bind(id).all();

  return c.json({ success: true, data: { ...customer, orders } });
});

export default customers;
