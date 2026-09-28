import { Hono } from 'hono';
import { Env, AdminUser } from '../types';
import { verifyPassword, generateJWT } from '../utils';
import { authMiddleware } from '../middleware/auth';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json();
  
  if (!username || !password) {
    return c.json({ success: false, error: 'Username and password are required' }, 400);
  }

  const user = await c.env.DB.prepare('SELECT * FROM admin_users WHERE username = ?')
    .bind(username)
    .first<AdminUser>();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return c.json({ success: false, error: 'Invalid credentials' }, 401);
  }

  const token = await generateJWT({ id: user.id, username: user.username }, c.env.JWT_SECRET);

  return c.json({
    success: true,
    data: { token, user: { id: user.id, username: user.username } }
  });
});

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ success: true, data: user });
});

export default auth;
