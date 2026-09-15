# 🛒 QShop — Website bán hàng trên Cloudflare Workers

Website bán hàng đơn giản sử dụng **Hono.js + TypeScript**, deploy lên **Cloudflare Workers**.

## ✨ Tính năng

| Route              | Mô tả                                  |
| ------------------ | -------------------------------------- |
| `GET /`            | Danh sách 6 sản phẩm (grid responsive) |
| `GET /product/:id` | Chi tiết sản phẩm                      |
| `GET /cart`        | Xem giỏ hàng                           |
| `POST /cart/add`   | Thêm sản phẩm vào giỏ (lưu cookie)     |

## 🚀 Hướng dẫn cài đặt & deploy

### Bước 1 — Cài dependencies

```bash
npm install
```

### Bước 2 — Đăng nhập Cloudflare

```bash
npx wrangler login
```

> Trình duyệt sẽ mở ra để bạn đăng nhập tài khoản Cloudflare.

### Bước 3 — Chạy local (dev)

```bash
npx wrangler dev
```

> Mở trình duyệt tại `http://localhost:8787` để xem website.

### Bước 4 — Deploy lên Cloudflare

```bash
npx wrangler deploy
```

> Sau khi deploy xong, bạn sẽ nhận được URL dạng `https://shop.<your-subdomain>.workers.dev`.

## 📁 Cấu trúc thư mục

```
shop/
├── src/index.ts       ← Toàn bộ code (routes, data, template)
├── package.json       ← Dependencies
├── wrangler.toml      ← Cấu hình Cloudflare Workers
└── README.md          ← File này
```

## 🛠 Tech Stack

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono.js v4
- **Language**: TypeScript
- **Database**: Không (mock data hardcode)
- **Session**: Cookie đơn giản
- **CSS**: Inline trong `<style>`
