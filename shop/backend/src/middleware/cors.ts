import { cors } from 'hono/cors';

export const corsMiddleware = (frontendUrl: string) => cors({
  origin: (origin) => {
    if (!origin) return '*';
    if (origin.includes('localhost') || origin.includes('pages.dev') || origin === frontendUrl) {
      return origin;
    }
    return frontendUrl || '*';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
});
