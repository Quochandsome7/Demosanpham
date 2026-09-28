import { Hono } from "hono";
import { Env } from "./types";
import { corsMiddleware } from "./middleware/cors";

import auth from "./routes/auth";
import products from "./routes/products";
import categories from "./routes/categories";
import orders from "./routes/orders";
import customers from "./routes/customers";
import cart from "./routes/cart";
import upload from "./routes/upload";

import customerAuth from "./routes/customerAuth";

const app = new Hono<{ Bindings: Env }>();

// Apply CORS globally
app.use("*", async (c, next) => {
  const cors = corsMiddleware(c.env.FRONTEND_URL || "http://localhost:5173");
  return cors(c, next);
});

app.get("/", (c) => {
  return c.json({ message: "Cellphone X API is running" });
});

const api = app.basePath("/api/v1");

api.route("/auth", auth);
api.route("/customer-auth", customerAuth);
api.route("/products", products);
api.route("/categories", categories);
api.route("/orders", orders);
api.route("/customers", customers);
api.route("/cart", cart);
api.route("/upload", upload);

export default app;
