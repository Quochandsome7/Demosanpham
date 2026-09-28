import { Hono } from 'hono';
import type { Env } from '../types';

const upload = new Hono<{ Bindings: Env }>();

// Validate image URL
upload.post('/', async (c) => {
  const body = await c.req.json();
  const { url } = body;
  
  if (!url || typeof url !== 'string') {
    return c.json({ success: false, error: 'URL is required' }, 400);
  }
  
  // Basic URL validation
  try {
    new URL(url);
  } catch {
    return c.json({ success: false, error: 'Invalid URL format' }, 400);
  }
  
  return c.json({ success: true, data: { url } });
});

export default upload;
