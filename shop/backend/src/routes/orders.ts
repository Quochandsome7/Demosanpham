import { Hono } from "hono";
import { Env } from "../types";
import { authMiddleware } from "../middleware/auth";

const orders = new Hono<{ Bindings: Env }>();

orders.get("/", authMiddleware, async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = parseInt(c.req.query("limit") || "10");
  const offset = (page - 1) * limit;

  const query = `
    SELECT o.*, c.name as customer_name, c.email as customer_email
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await c.env.DB.prepare(query).bind(limit, offset).all();

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM orders`,
  ).first<{ total: number }>();
  const total = countResult ? countResult.total : 0;

  return c.json({
    success: true,
    data: results,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

orders.get("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");

  const order = await c.env.DB.prepare(
    `
    SELECT o.*, c.name as customer_name, c.email as customer_email
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.id = ?
  `,
  )
    .bind(id)
    .first();

  if (!order) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }

  const { results: items } = await c.env.DB.prepare(
    `
    SELECT oi.*, p.name as product_name, p.image_url
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `,
  )
    .bind(id)
    .all();

  return c.json({ success: true, data: { ...order, items } });
});

orders.post("/", async (c) => {
  const {
    customer,
    items,
    shipping_address,
    phone,
    note,
    payment_method,
    bank_or_wallet,
  } = await c.req.json();

  if (!items || items.length === 0) {
    return c.json({ success: false, error: "Cart is empty" }, 400);
  }

  // 1. Find or create customer
  let customerId = null;
  if (customer && customer.name && customer.phone) {
    // Try to find by phone
    const existing = await c.env.DB.prepare(
      `SELECT id FROM customers WHERE phone = ?`,
    )
      .bind(customer.phone)
      .first<{ id: number }>();
    if (existing) {
      customerId = existing.id;
    } else {
      const newCust = await c.env.DB.prepare(
        `
        INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?) RETURNING id
      `,
      )
        .bind(customer.name, customer.email, customer.phone, customer.address)
        .first<{ id: number }>();
      if (newCust) customerId = newCust.id;
    }
  }

  // 2. Calculate total
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }

  // 3. Create order
  const order = await c.env.DB.prepare(
    `
    INSERT INTO orders (customer_id, status, total, payment_method, bank_or_wallet, shipping_address, phone, note)
    VALUES (?, 'pending', ?, ?, ?, ?, ?, ?) RETURNING id
  `,
  )
    .bind(
      customerId,
      total,
      payment_method || "cod",
      bank_or_wallet || null,
      shipping_address,
      phone,
      note,
    )
    .first<{ id: number }>();

  if (!order) {
    return c.json({ success: false, error: "Failed to create order" }, 500);
  }

  // 4. Create order items
  const stmts = items.map((item: any) =>
    c.env.DB.prepare(
      `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `,
    ).bind(order.id, item.product_id, item.quantity, item.price),
  );

  await c.env.DB.batch(stmts);

  // If there's a session_id in the request, clear their cart items
  const sessionId = c.req.header("x-session-id");
  if (sessionId) {
    await c.env.DB.prepare(`DELETE FROM cart_items WHERE session_id = ?`)
      .bind(sessionId)
      .run();
  }

  return c.json(
    { success: true, data: { id: order.id, total, status: "pending" } },
    201,
  );
});

orders.put("/:id", authMiddleware, async (c) => {
  const id = c.req.param("id");
  const { status } = await c.req.json();

  if (!status) {
    return c.json({ success: false, error: "Status is required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `
    UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *
  `,
  )
    .bind(status, id)
    .first();

  if (!result) {
    return c.json({ success: false, error: "Order not found" }, 404);
  }

  return c.json({ success: true, data: result });
});

export default orders;
