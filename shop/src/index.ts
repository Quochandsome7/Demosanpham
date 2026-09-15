import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

// ============================================================
// DATA
// ============================================================

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description: string;
}

const products: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 28990000,
    image: "https://picsum.photos/seed/iphone15/400/400",
    description:
      "iPhone 15 Pro Max với chip A17 Pro, camera 48MP, khung titan, màn hình Super Retina XDR 6.7 inch.",
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 25990000,
    image: "https://picsum.photos/seed/s24ultra/400/400",
    description:
      "Samsung Galaxy S24 Ultra trang bị chip Snapdragon 8 Gen 3, camera 200MP, S-Pen tích hợp.",
  },
  {
    id: 3,
    name: "MacBook Air M3",
    price: 27490000,
    image: "https://picsum.photos/seed/macbookair/400/400",
    description:
      "MacBook Air M3 siêu mỏng, chip Apple M3, 8GB RAM, màn hình Liquid Retina 13.6 inch.",
  },
  {
    id: 4,
    name: "iPad Pro M4",
    price: 23990000,
    image: "https://picsum.photos/seed/ipadpro/400/400",
    description:
      "iPad Pro M4 với màn hình OLED tandem, chip M4 mạnh mẽ, hỗ trợ Apple Pencil Pro.",
  },
  {
    id: 5,
    name: "AirPods Pro 2",
    price: 5690000,
    image: "https://picsum.photos/seed/airpods/400/400",
    description:
      "AirPods Pro 2 với chip H2, chống ồn chủ động, USB-C, âm thanh không gian cá nhân hóa.",
  },
  {
    id: 6,
    name: "Apple Watch Ultra 2",
    price: 18990000,
    image: "https://picsum.photos/seed/applewatch/400/400",
    description:
      "Apple Watch Ultra 2 với chip S9, màn hình 2000 nits, GPS chính xác 2 tần số, lặn 40m.",
  },
];

// ============================================================
// HELPERS
// ============================================================

function formatVND(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

interface CartItem {
  id: number;
  qty: number;
}

function getCart(raw: string | undefined): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return [];
}

function cartCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}

// ============================================================
// LAYOUT
// ============================================================

function layout(title: string, body: string, cart: CartItem[]): string {
  const count = cartCount(cart);
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — QShop</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f5f5f5;color:#222}
a{color:inherit;text-decoration:none}
header{background:#ff6b35;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,.15)}
header .logo{font-size:1.5rem;font-weight:800;letter-spacing:-1px}
header nav a{color:#fff;margin-left:20px;font-weight:600;position:relative}
header nav a:hover{opacity:.85}
.badge{background:#fff;color:#ff6b35;font-size:.7rem;font-weight:700;padding:1px 6px;border-radius:10px;position:absolute;top:-8px;right:-14px}
main{max-width:1100px;margin:30px auto;padding:0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
.card{background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-4px);box-shadow:0 6px 20px rgba(0,0,0,.12)}
.card img{width:100%;height:220px;object-fit:cover}
.card-body{padding:16px}
.card-body h3{font-size:1rem;margin-bottom:6px}
.card-body .price{color:#ff6b35;font-weight:700;font-size:1.15rem;margin-bottom:12px}
.btn{display:inline-block;background:#ff6b35;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:.9rem;font-weight:600;cursor:pointer;transition:background .2s}
.btn:hover{background:#e55a2b}
.btn-outline{background:transparent;color:#ff6b35;border:2px solid #ff6b35}
.btn-outline:hover{background:#ff6b35;color:#fff}
.detail{display:flex;gap:32px;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.detail img{width:400px;max-width:100%;border-radius:10px;object-fit:cover}
.detail-info{flex:1}
.detail-info h1{font-size:1.6rem;margin-bottom:8px}
.detail-info .price{color:#ff6b35;font-weight:700;font-size:1.4rem;margin-bottom:16px}
.detail-info p{line-height:1.7;color:#555;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
th,td{padding:14px 18px;text-align:left;border-bottom:1px solid #eee}
th{background:#ff6b35;color:#fff;font-weight:600}
.total{font-size:1.2rem;font-weight:700;margin-top:20px;text-align:right;color:#ff6b35}
.empty{text-align:center;padding:60px 20px;color:#888}
.empty span{font-size:3rem;display:block;margin-bottom:12px}
footer{text-align:center;padding:24px;color:#999;font-size:.85rem;margin-top:40px}
@media(max-width:700px){.detail{flex-direction:column}.detail img{width:100%}}
</style>
</head>
<body>
<header>
  <a href="/" class="logo">🛒 QShop</a>
  <nav>
    <a href="/">Sản phẩm</a>
    <a href="/cart">Giỏ hàng${count > 0 ? `<span class="badge">${count}</span>` : ""}</a>
  </nav>
</header>
<main>${body}</main>
<footer>© 2026 QShop — Made with ❤️ by Quốc Jee</footer>
</body>
</html>`;
}

// ============================================================
// APP
// ============================================================

const app = new Hono();

// ---------- Trang chủ ----------
app.get("/", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const cards = products
    .map(
      (p) => `
    <div class="card">
      <a href="/product/${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy"></a>
      <div class="card-body">
        <h3><a href="/product/${p.id}">${p.name}</a></h3>
        <div class="price">${formatVND(p.price)}</div>
        <form method="POST" action="/cart/add">
          <input type="hidden" name="id" value="${p.id}">
          <button class="btn" type="submit">🛒 Thêm vào giỏ</button>
        </form>
      </div>
    </div>`,
    )
    .join("");

  return c.html(
    layout(
      "Trang chủ",
      `<h2 style="margin-bottom:20px">📱 Sản phẩm nổi bật</h2><div class="grid">${cards}</div>`,
      cart,
    ),
  );
});

// ---------- Chi tiết sản phẩm ----------
app.get("/product/:id", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const id = Number(c.req.param("id"));
  const p = products.find((x) => x.id === id);
  if (!p)
    return c.html(
      layout(
        "Không tìm thấy",
        '<div class="empty"><span>😢</span>Sản phẩm không tồn tại.<br><a href="/" class="btn" style="margin-top:16px">← Về trang chủ</a></div>',
        cart,
      ),
      404,
    );

  const html = `
  <div class="detail">
    <img src="${p.image}" alt="${p.name}">
    <div class="detail-info">
      <h1>${p.name}</h1>
      <div class="price">${formatVND(p.price)}</div>
      <p>${p.description}</p>
      <form method="POST" action="/cart/add">
        <input type="hidden" name="id" value="${p.id}">
        <button class="btn" type="submit">🛒 Thêm vào giỏ</button>
      </form>
      <a href="/" class="btn btn-outline" style="margin-top:10px">← Tiếp tục mua sắm</a>
    </div>
  </div>`;

  return c.html(layout(p.name, html, cart));
});

// ---------- Xem giỏ hàng ----------
app.get("/cart", (c) => {
  const cart = getCart(getCookie(c, "cart"));

  if (cart.length === 0) {
    return c.html(
      layout(
        "Giỏ hàng",
        '<div class="empty"><span>🛒</span>Giỏ hàng trống!<br><a href="/" class="btn" style="margin-top:16px">← Mua sắm ngay</a></div>',
        cart,
      ),
    );
  }

  let total = 0;
  const rows = cart
    .map((item) => {
      const p = products.find((x) => x.id === item.id);
      if (!p) return "";
      const sub = p.price * item.qty;
      total += sub;
      return `<tr>
        <td><a href="/product/${p.id}" style="display:flex;align-items:center;gap:10px"><img src="${p.image}" width="50" height="50" style="border-radius:6px;object-fit:cover"> ${p.name}</a></td>
        <td>${formatVND(p.price)}</td>
        <td>${item.qty}</td>
        <td>${formatVND(sub)}</td>
      </tr>`;
    })
    .join("");

  const html = `
  <h2 style="margin-bottom:20px">🛒 Giỏ hàng của bạn</h2>
  <table>
    <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">Tổng cộng: ${formatVND(total)}</div>
  <div style="margin-top:20px;display:flex;gap:12px;justify-content:flex-end">
    <a href="/" class="btn btn-outline">← Tiếp tục mua</a>
    <button class="btn" onclick="alert('Cảm ơn bạn đã đặt hàng! 🎉')">Đặt hàng</button>
  </div>`;

  return c.html(layout("Giỏ hàng", html, cart));
});

// ---------- Thêm vào giỏ ----------
app.post("/cart/add", async (c) => {
  const body = await c.req.parseBody();
  const id = Number(body["id"]);
  if (!products.find((p) => p.id === id)) return c.redirect("/");

  const cart = getCart(getCookie(c, "cart"));
  const existing = cart.find((i) => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  setCookie(c, "cart", encodeURIComponent(JSON.stringify(cart)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return c.redirect("/cart");
});

export default app;
