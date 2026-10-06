import { cors } from "hono/cors";

export const corsMiddleware = (frontendUrl: string) =>
  cors({
    origin: (origin) => {
      if (!origin) return "*";
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.includes("pages.dev") ||
        origin.includes("workers.dev") ||
        origin === frontendUrl
      ) {
        return origin;
      }
      return frontendUrl || "*";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "x-session-id",
      "X-Session-Id",
      "x-reindex-secret",
    ],
    exposeHeaders: ["Content-Length", "X-Session-Id"],
    credentials: true,
  });
