import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const products = new Hono<{ Bindings: Env }>();

products.get('/', async (c) => {
  const categoryId = c.req.query('category_id');
  const q = c.req.query('q');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '12');
  const offset = (page - 1) * limit;

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.is_active = 1
  `;
  const params: any[] = [];

  if (categoryId) {
    query += ` AND p.category_id = ?`;
    params.push(categoryId);
  }

  if (q) {
    query += ` AND p.name LIKE ?`;
    params.push(`%${q}%`);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Count total
  let countQuery = `SELECT COUNT(*) as total FROM products WHERE is_active = 1`;
  const countParams: any[] = [];
  if (categoryId) {
    countQuery += ` AND category_id = ?`;
    countParams.push(categoryId);
  }
  if (q) {
    countQuery += ` AND name LIKE ?`;
    countParams.push(`%${q}%`);
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{total: number}>();
  const total = countResult ? countResult.total : 0;

  // parse specs json
  const formattedResults = results.map((p: any) => ({
    ...p,
    specs: p.specs ? JSON.parse(p.specs) : null,
    is_active: Boolean(p.is_active)
  }));

  return c.json({ 
    success: true, 
    data: formattedResults,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

products.get('/:id', async (c) => {
  const id = c.req.param('id');
  const query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.id = ? AND p.is_active = 1
  `;
  const product = await c.env.DB.prepare(query).bind(id).first<any>();

  if (!product) {
    return c.json({ success: false, error: 'Product not found' }, 404);
  }

  product.specs = product.specs ? JSON.parse(product.specs) : null;
  product.is_active = Boolean(product.is_active);

  return c.json({ success: true, data: product });
});

products.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();
  const { name, price, original_price, image_url, description, category_id, badge, chip, specs, stock } = body;
  
  const specsStr = specs ? JSON.stringify(specs) : null;

  const result = await c.env.DB.prepare(`
    INSERT INTO products (name, price, original_price, image_url, description, category_id, badge, chip, specs, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `).bind(name, price, original_price, image_url, description, category_id, badge, chip, specsStr, stock || 100).first();

  return c.json({ success: true, data: result }, 201);
});

products.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  
  // Exclude id, created_at, etc. Build dynamic query
  const fields = ['name', 'price', 'original_price', 'image_url', 'description', 'category_id', 'badge', 'chip', 'stock', 'is_active'];
  const updates = [];
  const params = [];
  
  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(body[field]);
    }
  }

  if (body.specs !== undefined) {
    updates.push(`specs = ?`);
    params.push(body.specs ? JSON.stringify(body.specs) : null);
  }

  if (updates.length === 0) {
    return c.json({ success: false, error: 'No fields to update' }, 400);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  params.push(id);

  const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ? RETURNING *`;
  
  const result = await c.env.DB.prepare(query).bind(...params).first();

  if (!result) {
    return c.json({ success: false, error: 'Product not found' }, 404);
  }

  return c.json({ success: true, data: result });
});

products.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  
  const result = await c.env.DB.prepare(`
    UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).bind(id).run();

  if (result.meta.changes === 0) {
    return c.json({ success: false, error: 'Product not found' }, 404);
  }

  return c.json({ success: true, message: 'Product soft deleted' });
});

export default products;
