# 📖 Hướng dẫn sử dụng Cloudflare D1 & R2 — Cellphone X

## Mục lục

- [1. Cloudflare D1 (Database)](#1-cloudflare-d1-database)
- [2. Cloudflare R2 (Object Storage)](#2-cloudflare-r2-object-storage)
- [3. Triển khai (Deploy)](#3-triển-khai-deploy)
- [4. Xử lý sự cố](#4-xử-lý-sự-cố)

---

## 1. Cloudflare D1 (Database)

### D1 là gì?

D1 là cơ sở dữ liệu SQL (SQLite) serverless của Cloudflare, chạy trên edge. Trong Cellphone X, D1 lưu trữ:

- **Sản phẩm** (products)
- **Danh mục** (categories)
- **Khách hàng** (customers)
- **Đơn hàng** (orders + order_items)
- **Giỏ hàng** (cart_items)
- **Tài khoản admin** (admin_users)

### Chi phí D1

| Hạng mục           | Gói Free (Workers Free) | Gói trả phí           |
| ------------------ | ----------------------- | --------------------- |
| Đọc (rows read)    | **5 triệu/ngày**        | $0.001 / 1 triệu rows |
| Ghi (rows written) | **100.000/ngày**        | $1.00 / 1 triệu rows  |
| Dung lượng DB      | **5 GB**                | $0.75 / GB-tháng      |

> 💡 Với shop nhỏ-vừa, **hoàn toàn miễn phí**!

### Các bước thiết lập D1

#### Bước 1: Đăng nhập Wrangler

```bash
npx wrangler login
```

Trình duyệt sẽ mở ra → Đăng nhập tài khoản Cloudflare → Cho phép quyền truy cập.

#### Bước 2: Tạo database D1

```bash
cd backend
npx wrangler d1 create cellphonex-db
```

Kết quả sẽ hiện:

```
✅ Successfully created DB 'cellphonex-db'

[[d1_databases]]
binding = "DB"
database_name = "cellphonex-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

#### Bước 3: Cập nhật wrangler.toml

Sao chép `database_id` từ bước 2 vào file `backend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cellphonex-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← Paste ID vào đây
```

#### Bước 4: Chạy schema (tạo bảng)

```bash
# Local (để phát triển)
npx wrangler d1 execute cellphonex-db --local --file=src/db/schema.sql

# Production (khi deploy)
npx wrangler d1 execute cellphonex-db --file=src/db/schema.sql
```

#### Bước 5: Chạy seed data (thêm dữ liệu mẫu)

```bash
# Local
npx wrangler d1 execute cellphonex-db --local --file=src/db/seed.sql

# Production
npx wrangler d1 execute cellphonex-db --file=src/db/seed.sql
```

#### Bước 6: Kiểm tra dữ liệu

```bash
# Xem danh sách sản phẩm
npx wrangler d1 execute cellphonex-db --local --command="SELECT id, name, price FROM products"

# Xem danh mục
npx wrangler d1 execute cellphonex-db --local --command="SELECT * FROM categories"

# Xem admin
npx wrangler d1 execute cellphonex-db --local --command="SELECT id, username FROM admin_users"
```

### Các lệnh D1 thường dùng

| Lệnh                                       | Mô tả                   |
| ------------------------------------------ | ----------------------- |
| `wrangler d1 list`                         | Liệt kê tất cả database |
| `wrangler d1 execute <db> --command="SQL"` | Chạy SQL trực tiếp      |
| `wrangler d1 execute <db> --file=file.sql` | Chạy file SQL           |
| `wrangler d1 execute <db> --local ...`     | Chạy trên DB local      |
| `wrangler d1 info <db>`                    | Xem thông tin database  |
| `wrangler d1 delete <db>`                  | Xóa database            |

### Schema Database

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│ categories  │     │   products   │     │  cart_items   │
│─────────────│     │──────────────│     │──────────────│
│ id (PK)     │◄────│ category_id  │     │ id (PK)      │
│ name        │     │ id (PK)      │◄────│ product_id   │
│ slug        │     │ name         │     │ session_id   │
│ icon        │     │ price        │     │ quantity     │
│ created_at  │     │ original_price│    │ created_at   │
└─────────────┘     │ image_url    │     └──────────────┘
                    │ description  │
                    │ rating       │     ┌──────────────┐
                    │ reviews      │     │  customers   │
                    │ badge        │     │──────────────│
                    │ chip         │     │ id (PK)      │
                    │ specs (JSON) │     │ name         │
                    │ stock        │     │ email        │
                    │ is_active    │     │ phone        │
                    │ created_at   │     │ address      │
                    │ updated_at   │     │ created_at   │
                    └──────────────┘     └──────┬───────┘
                                               │
┌──────────────┐     ┌──────────────┐          │
│ order_items  │     │   orders     │          │
│──────────────│     │──────────────│          │
│ id (PK)      │     │ id (PK)      │◄─────────┘
│ order_id ────│────►│ customer_id  │
│ product_id   │     │ status       │
│ quantity     │     │ total        │
│ price        │     │ shipping_addr│
└──────────────┘     │ phone        │
                     │ note         │
┌──────────────┐     │ created_at   │
│ admin_users  │     │ updated_at   │
│──────────────│     └──────────────┘
│ id (PK)      │
│ username     │
│ password_hash│
│ created_at   │
└──────────────┘
```

---

## 2. Cloudflare R2 (Object Storage)

### R2 là gì?

R2 là dịch vụ lưu trữ đối tượng (object storage) của Cloudflare, tương tự Amazon S3 nhưng **không tính phí bandwidth**. Trong Cellphone X, R2 dùng để:

- 📸 Lưu ảnh sản phẩm do Admin upload
- 🖼️ Serve ảnh cho khách hàng truy cập web
- 📁 Lưu trữ file media khác (banner, logo...)

### Chi phí R2

| Hạng mục               | Miễn phí hàng tháng        | Phí vượt mức      |
| ---------------------- | -------------------------- | ----------------- |
| **Dung lượng**         | 10 GB                      | $0.015 / GB-tháng |
| **Class A (PUT/POST)** | 1 triệu request            | $4.50 / 1 triệu   |
| **Class B (GET)**      | 10 triệu request           | $0.36 / 1 triệu   |
| **Bandwidth (egress)** | **KHÔNG GIỚI HẠN — $0** ✅ | $0                |

> 💡 Với vài chục sản phẩm, mỗi ảnh 200-500KB → chỉ dùng ~100MB → **1% gói free**!

### Các bước thiết lập R2

#### Bước 1: Tạo R2 bucket

```bash
cd backend
npx wrangler r2 bucket create cellphonex-images
```

Kết quả:

```
✅ Created bucket 'cellphonex-images'
```

#### Bước 2: Xác nhận wrangler.toml

File `backend/wrangler.toml` đã có sẵn cấu hình R2:

```toml
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "cellphonex-images"
```

#### Bước 3: Kiểm tra bucket

```bash
# Liệt kê bucket
npx wrangler r2 bucket list

# Xem objects trong bucket
npx wrangler r2 object list cellphonex-images
```

### Cách hoạt động R2 trong Cellphone X

#### Upload ảnh (Admin Panel)

1. Admin vào trang Quản lý Sản phẩm → Thêm/Sửa sản phẩm
2. Kéo thả hoặc chọn file ảnh từ máy tính
3. Frontend gửi file qua `POST /api/v1/upload` (multipart/form-data)
4. Backend nhận file → tạo key duy nhất → lưu vào R2 bucket
5. Trả về URL ảnh: `/api/v1/images/{key}`
6. URL này được lưu vào trường `image_url` của product trong D1

#### Hiển thị ảnh (Customer)

1. Khách truy cập web → Frontend load product data từ API
2. Product có `image_url` trỏ đến `/api/v1/images/{key}`
3. Backend nhận request → đọc file từ R2 → trả về với Content-Type và cache headers
4. Ảnh hiển thị trên trình duyệt

```
Admin Upload Flow:
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Admin   │────►│  Worker  │────►│    R2    │
│ (browser)│ POST│  (API)   │ PUT │ (bucket) │
└──────────┘     └──────────┘     └──────────┘
                      │
                      ▼
                 ┌──────────┐
                 │    D1    │ Save image_url
                 │   (DB)   │
                 └──────────┘

Customer View Flow:
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Customer │────►│  Worker  │────►│    R2    │
│ (browser)│ GET │  (API)   │ GET │ (bucket) │
└──────────┘     └──────────┘     └──────────┘
```

### Các lệnh R2 thường dùng

| Lệnh                                                  | Mô tả                        |
| ----------------------------------------------------- | ---------------------------- |
| `wrangler r2 bucket list`                             | Liệt kê tất cả bucket        |
| `wrangler r2 bucket create <name>`                    | Tạo bucket mới               |
| `wrangler r2 bucket delete <name>`                    | Xóa bucket                   |
| `wrangler r2 object list <bucket>`                    | Liệt kê objects trong bucket |
| `wrangler r2 object get <bucket> <key>`               | Tải object về                |
| `wrangler r2 object put <bucket> <key> --file=<path>` | Upload file lên bucket       |
| `wrangler r2 object delete <bucket> <key>`            | Xóa object                   |

---

## 3. Triển khai (Deploy)

### Bước setup đầy đủ (lần đầu)

```bash
# 1. Đăng nhập Cloudflare
npx wrangler login

# 2. Tạo D1 database
cd backend
npx wrangler d1 create cellphonex-db
# → Copy database_id vào wrangler.toml

# 3. Tạo R2 bucket
npx wrangler r2 bucket create cellphonex-images

# 4. Chạy schema + seed (production)
npx wrangler d1 execute cellphonex-db --file=src/db/schema.sql
npx wrangler d1 execute cellphonex-db --file=src/db/seed.sql

# 5. Deploy backend
npx wrangler deploy

# 6. Build & deploy frontend
cd ../frontend
npm run build
# Deploy build output lên Cloudflare Pages hoặc hosting khác
```

### Chạy local (phát triển)

```bash
# Terminal 1: Backend API (port 8787)
cd backend
npx wrangler d1 execute cellphonex-db --local --file=src/db/schema.sql
npx wrangler d1 execute cellphonex-db --local --file=src/db/seed.sql
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

Truy cập:

- 🛒 Customer UI: http://localhost:5173
- 🔧 Admin Panel: http://localhost:5173/admin/login
- 📡 API: http://localhost:8787/api/v1/products

### Đăng nhập Admin

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Quan trọng**: Đổi mật khẩu admin và JWT_SECRET trước khi deploy production!

---

## 4. Xử lý sự cố

### D1: "no such table"

```bash
# Chạy lại schema
npx wrangler d1 execute cellphonex-db --local --file=src/db/schema.sql
```

### D1: "database not found"

```bash
# Kiểm tra database_id trong wrangler.toml có đúng không
npx wrangler d1 list
```

### R2: "bucket not found"

```bash
# Tạo lại bucket
npx wrangler r2 bucket create cellphonex-images
```

### R2: Upload ảnh bị lỗi 413 (file quá lớn)

- Giảm kích thước ảnh < 5MB
- Nén ảnh trước khi upload (dùng tinypng.com)

### Frontend không gọi được API

- Kiểm tra backend đang chạy ở port 8787
- Kiểm tra proxy trong `vite.config.ts` trỏ đúng đến `http://localhost:8787`
- Kiểm tra CORS trong `backend/src/middleware/cors.ts`

### Lỗi JWT / Unauthorized

- Xóa localStorage → đăng nhập lại
- Kiểm tra JWT_SECRET trong wrangler.toml
