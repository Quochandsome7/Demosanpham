import { Hono } from "hono";
import type { Env, Customer } from "../types";
import { hashPassword, verifyPassword, generateJWT, verifyJWT } from "../utils";

const customerAuth = new Hono<{ Bindings: Env }>();

// Customer Register
customerAuth.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const { name, phone, email, password, address } = body;

    if (!name || !phone || !password) {
      return c.json(
        {
          success: false,
          error: "Họ tên, số điện thoại và mật khẩu là bắt buộc",
        },
        400,
      );
    }

    if (password.length < 6) {
      return c.json(
        { success: false, error: "Mật khẩu phải có tối thiểu 6 ký tự" },
        400,
      );
    }

    // Check if phone or email already registered
    let existing;
    if (email) {
      existing = await c.env.DB.prepare(
        "SELECT id FROM customers WHERE phone = ? OR email = ?",
      )
        .bind(phone, email)
        .first();
    } else {
      existing = await c.env.DB.prepare(
        "SELECT id FROM customers WHERE phone = ?",
      )
        .bind(phone)
        .first();
    }

    if (existing) {
      return c.json(
        {
          success: false,
          error: "Số điện thoại hoặc email này đã được đăng ký",
        },
        409,
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await c.env.DB.prepare(
      "INSERT INTO customers (name, phone, email, address, password_hash) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(name, phone, email || null, address || null, passwordHash)
      .run();

    const customerId = result.meta.last_row_id;

    const userPayload = {
      id: customerId,
      name,
      phone,
      email: email || null,
      address: address || null,
      role: "customer",
    };

    const token = await generateJWT(userPayload, c.env.JWT_SECRET);

    return c.json(
      {
        success: true,
        data: {
          token,
          user: userPayload,
        },
      },
      201,
    );
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Lỗi đăng ký tài khoản" },
      500,
    );
  }
});

// Customer Login
customerAuth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { identifier, password } = body; // identifier can be email or phone

    if (!identifier || !password) {
      return c.json(
        {
          success: false,
          error: "Vui lòng nhập số điện thoại/email và mật khẩu",
        },
        400,
      );
    }

    const customer = await c.env.DB.prepare(
      "SELECT * FROM customers WHERE phone = ? OR email = ?",
    )
      .bind(identifier, identifier)
      .first<Customer>();

    if (!customer || !customer.password_hash) {
      return c.json(
        {
          success: false,
          error: "Tài khoản không tồn tại hoặc chưa cài mật khẩu",
        },
        401,
      );
    }

    const isValid = await verifyPassword(password, customer.password_hash);
    if (!isValid) {
      return c.json({ success: false, error: "Mật khẩu không chính xác" }, 401);
    }

    const userPayload = {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      role: "customer",
    };

    const token = await generateJWT(userPayload, c.env.JWT_SECRET);

    return c.json({
      success: true,
      data: {
        token,
        user: userPayload,
      },
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Lỗi đăng nhập" },
      500,
    );
  }
});

// Get Current Customer Profile
customerAuth.get("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, error: "Chưa đăng nhập" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    if (!payload || !payload.id) {
      return c.json(
        {
          success: false,
          error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
        },
        401,
      );
    }

    const customer = await c.env.DB.prepare(
      "SELECT id, name, phone, email, address, created_at FROM customers WHERE id = ?",
    )
      .bind(payload.id)
      .first<Customer>();

    if (!customer) {
      return c.json(
        { success: false, error: "Không tìm thấy thông tin khách hàng" },
        404,
      );
    }

    return c.json({
      success: true,
      data: customer,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Lỗi xác thực" },
      401,
    );
  }
});

// Update Customer Profile
customerAuth.put("/me", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ success: false, error: "Chưa đăng nhập" }, 401);
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    if (!payload || !payload.id) {
      return c.json(
        { success: false, error: "Phiên đăng nhập không hợp lệ" },
        401,
      );
    }

    const body = await c.req.json();
    const { name, phone, email, address } = body;

    await c.env.DB.prepare(
      "UPDATE customers SET name = coalesce(?, name), phone = coalesce(?, phone), email = coalesce(?, email), address = coalesce(?, address) WHERE id = ?",
    )
      .bind(
        name || null,
        phone || null,
        email || null,
        address || null,
        payload.id,
      )
      .run();

    const updated = await c.env.DB.prepare(
      "SELECT id, name, phone, email, address, created_at FROM customers WHERE id = ?",
    )
      .bind(payload.id)
      .first<Customer>();

    return c.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return c.json(
      { success: false, error: err.message || "Lỗi cập nhật thông tin" },
      500,
    );
  }
});

export default customerAuth;
