import { cors } from "hono/cors";

export const corsMiddleware = (frontendUrl: string) =>
  cors({
    origin: frontendUrl,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
  });
