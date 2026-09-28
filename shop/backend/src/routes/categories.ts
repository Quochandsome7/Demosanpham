import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../middleware/auth';

const categories = new Hono<{ Bindings: Env }>();

categories.get('/', async (c) => {
  const query = `
    SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
    GROUP BY c.id
    ORDER BY c.id ASC
  `;
  const { results } = await c.env.DB.prepare(query).all();
  return c.json({ success: true, data: results });
});

categories.post('/', authMiddleware, async (c) => {
  const { name, slug, icon } = await c.req.json();
  
  try {
    const result = await c.env.DB.prepare(`
      INSERT INTO categories (name, slug, icon) VALUES (?, ?, ?) RETURNING *
    `).bind(name, slug, icon).first();
    
    return c.json({ success: true, data: result }, 201);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

categories.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { name, slug, icon } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    UPDATE categories SET name = ?, slug = ?, icon = ? WHERE id = ? RETURNING *
  `).bind(name, slug, icon, id).first();

  if (!result) {
    return c.json({ success: false, error: 'Category not found' }, 404);
  }

  return c.json({ success: true, data: result });
});

categories.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  
  // Check if there are products in this category
  const products = await c.env.DB.prepare(`SELECT count(*) as count FROM products WHERE category_id = ? AND is_active = 1`).bind(id).first<{count: number}>();
  if (products && products.count > 0) {
    return c.json({ success: false, error: 'Cannot delete category with active products' }, 400);
  }
  
  const result = await c.env.DB.prepare(`DELETE FROM categories WHERE id = ?`).bind(id).run();
  
  if (result.meta.changes === 0) {
    return c.json({ success: false, error: 'Category not found' }, 404);
  }

  return c.json({ success: true, message: 'Category deleted' });
});

export default categories;
