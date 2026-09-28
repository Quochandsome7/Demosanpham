# 🛒 Cellphone X — E-Commerce Platform

Nền tảng thương mại điện tử chuyên nghiệp cho cửa hàng công nghệ, được xây dựng với kiến trúc hiện đại.

## 🏗️ Kiến trúc

```
cellphonex/
├── frontend/          # SvelteKit + TailwindCSS (Mobile-first)
├── backend/           # Cloudflare Workers + HonoJS
└── docs/              # Tài liệu hướng dẫn
```

| Layer        | Công nghệ                   | Mô tả                                  |
| ------------ | --------------------------- | -------------------------------------- |
| **Frontend** | SvelteKit + TailwindCSS     | SPA mobile-first, dark tech theme      |
| **Backend**  | HonoJS + Cloudflare Workers | REST API serverless                    |
| **Database** | Cloudflare D1 (SQLite)      | Lưu trữ sản phẩm, đơn hàng, khách hàng |
| **Storage**  | Cloudflare R2               | Lưu trữ ảnh sản phẩm                   |
| **Auth**     | JWT (Web Crypto API)        | Xác thực admin panel                   |

## ✨ Tính năng

### 🛍️ Customer UI

- Homepage với particle canvas animation, hero section, ticker banner
- Product catalog với 3D card tilt, category filter, search
- Product detail với chip badges, specs, stock pulse
- Shopping cart (session-based qua D1)
- Checkout với form thông tin khách hàng
- Trang hỗ trợ: Đổi trả, Bảo hành, Vận chuyển, FAQ

### 🔧 Admin Panel

- Dashboard thống kê: doanh thu, đơn hàng, sản phẩm, khách hàng
- Quản lý sản phẩm: thêm/sửa/xóa, upload ảnh lên R2
- Quản lý danh mục: thêm/sửa/xóa
- Quản lý đơn hàng: xem chi tiết, cập nhật trạng thái
- Quản lý khách hàng: danh sách, lịch sử đơn hàng

### 🎨 Animations & Effects

- Cyber particle network canvas (interactive)
- 3D card tilt with dynamic spotlight
- Infinite ticker marquee banner
- Laser sweep cyber buttons
- Svelte transitions (fly, fade, slide)
- Intersection observer scroll animations

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Cloudflare Account](https://dash.cloudflare.com/sign-up) (miễn phí)

### 1. Cài đặt dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup D1 Database (local)

```bash
cd backend

# Tạo database
npx wrangler d1 create cellphonex-db
# Copy database_id vào wrangler.toml

# Tạo bảng
npx wrangler d1 execute cellphonex-db --local --file=src/db/schema.sql

# Thêm dữ liệu mẫu
npx wrangler d1 execute cellphonex-db --local --file=src/db/seed.sql
```

### 3. Setup R2 Bucket

```bash
npx wrangler r2 bucket create cellphonex-images
```

### 4. Chạy development server

```bash
# Terminal 1: Backend (port 8787)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

### 5. Truy cập

| URL                                   | Mô tả          |
| ------------------------------------- | -------------- |
| http://localhost:5173                 | 🛒 Customer UI |
| http://localhost:5173/admin/login     | 🔧 Admin Panel |
| http://localhost:8787/api/v1/products | 📡 API         |

### Admin Login

- **Username**: `admin`
- **Password**: `admin123`

## 📡 API Endpoints

| Method   | Route                  | Mô tả           | Auth |
| -------- | ---------------------- | --------------- | ---- |
| `GET`    | `/api/v1/products`     | List products   | -    |
| `GET`    | `/api/v1/products/:id` | Product detail  | -    |
| `POST`   | `/api/v1/products`     | Create product  | ✅   |
| `PUT`    | `/api/v1/products/:id` | Update product  | ✅   |
| `DELETE` | `/api/v1/products/:id` | Delete product  | ✅   |
| `GET`    | `/api/v1/categories`   | List categories | -    |
| `POST`   | `/api/v1/categories`   | Create category | ✅   |
| `GET`    | `/api/v1/cart`         | Get cart        | -    |
| `POST`   | `/api/v1/cart`         | Add to cart     | -    |
| `POST`   | `/api/v1/orders`       | Checkout        | -    |
| `GET`    | `/api/v1/orders`       | List orders     | ✅   |
| `GET`    | `/api/v1/customers`    | List customers  | ✅   |
| `POST`   | `/api/v1/upload`       | Upload image    | ✅   |
| `GET`    | `/api/v1/images/:key`  | Serve image     | -    |
| `POST`   | `/api/v1/auth/login`   | Admin login     | -    |

## 📖 Tài liệu

- [Hướng dẫn D1 & R2](docs/D1_R2_GUIDE.md) — Setup, sử dụng, chi phí, xử lý sự cố

## 🏢 Thông tin cửa hàng

- **Tên**: Cellphone X
- **Địa chỉ**: TP. Thái Nguyên
- **Điện thoại**: 0969610085
- **Email**: nguyendiem1892005@gmail.com

---

© 2026 Cellphone X — Made with ❤️ by Quốc Jee. All rights reserved.
