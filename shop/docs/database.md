# Cơ sở dữ liệu (Cloudflare D1)

- **Tên database:** `cellphonex-db` (binding `DB`)
- **Tạo bảng:** `shop/backend/migrations/` – chạy theo thứ tự số
- **Dữ liệu mẫu:** `shop/backend/seeds/` – chạy theo thứ tự số
- Dự án **chưa dùng hệ thống migration của Wrangler**: các tệp được chạy bằng `wrangler d1 execute`. Mọi câu `CREATE` đều có `IF NOT EXISTS` nên chạy lại an toàn.

## Các tệp SQL

| Tệp | Nội dung | Chạy lại được? |
|---|---|---|
| `migrations/0001_schema.sql` | 7 bảng chính: `categories`, `products`, `customers`, `orders`, `order_items`, `cart_items`, `admin_users` | Có |
| `migrations/0002_wishlist.sql` | Bảng `wishlist_items` | Có |
| `migrations/0003_analytics.sql` | Bảng `analytics_events` + 2 chỉ mục | Có |
| `seeds/0001_seed.sql` | 5 danh mục, 6 sản phẩm đầu tiên, tài khoản quản trị `admin` / `admin123` | **Không** (chèn kèm `id` cố định) |
| `seeds/0002_seed_20_products.sql` | Thêm 20 sản phẩm (bỏ qua sản phẩm trùng tên) | Có |
| `seeds/0003_update_descriptions.sql` | Cập nhật mô tả chi tiết cho 6 sản phẩm | Có |

Lệnh (chạy trong `shop/`, hoặc dùng trực tiếp `wrangler` trong `shop/backend/`):
```bash
npm run db:migrate:local    # tạo bảng trên D1 ở máy (.wrangler/state)
npm run db:seed:local       # nạp dữ liệu mẫu ở máy
npm run db:migrate:remote   # tạo bảng trên D1 thật
npm run db:seed:remote      # nạp dữ liệu mẫu lên D1 thật (chỉ lần đầu)

# Truy vấn nhanh
cd backend && npx wrangler d1 execute cellphonex-db --remote --command="SELECT COUNT(*) FROM products"
```

> Sau khi nạp hoặc sửa nhiều sản phẩm trực tiếp bằng SQL, gọi `POST /api/v1/chat/reindex` để chatbot cập nhật vector (xem [deployment.md](deployment.md#5-nạp-vector-cho-chatbot)).

## Các bảng

| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `categories` | `id`, `name` (UNIQUE), `slug` (UNIQUE), `icon`, `created_at` | Điện thoại, Laptop, Tablet, Phụ kiện, Đồng hồ |
| `products` | `id`, `name`, `price`, `original_price`, `image_url`, `description`, `category_id` → `categories`, `rating`, `reviews`, `badge`, `chip`, `specs` (JSON), `stock` (mặc định 100), `is_active`, `created_at`, `updated_at` | Xóa = `is_active = 0` |
| `customers` | `id`, `name`, `email` (UNIQUE), `phone`, `address`, `password_hash`, `created_at` | Tạo khi đăng ký hoặc khi đặt hàng (tìm theo SĐT) |
| `orders` | `id`, `customer_id` → `customers`, `status` (mặc định `pending`), `total`, `payment_method` (`cod`…), `bank_or_wallet`, `shipping_address`, `phone`, `note`, `created_at`, `updated_at` | Trạng thái: `pending` → `confirmed` → `shipping` → `delivered` / `cancelled` |
| `order_items` | `id`, `order_id` → `orders` (CASCADE), `product_id` → `products`, `quantity`, `price` | Giá tại thời điểm đặt |
| `cart_items` | `id`, `session_id`, `product_id` → `products`, `quantity`, `created_at` | UNIQUE(`session_id`, `product_id`) |
| `wishlist_items` | `id`, `session_id`, `product_id` → `products` (CASCADE), `created_at` | UNIQUE(`session_id`, `product_id`) |
| `admin_users` | `id`, `username` (UNIQUE), `password_hash`, `created_at` | Mật khẩu băm SHA-256 |
| `analytics_events` | `id`, `event`, `path`, `referrer`, `device`, `browser`, `os`, `ip`, `country`, `city`, `visitor_id`, `user_id`, `product_id`, `created_at` | Chỉ mục theo `created_at`, `event`; tự xóa sau 30 ngày |

## Quan hệ
```
categories 1 ──< products >── 1 order_items >── 1 orders >── 1 customers
                   │  ▲
                   │  └── cart_items, wishlist_items (theo session_id)
                   └──── analytics_events.product_id (không ràng buộc khóa ngoại)
```

## Thay đổi cấu trúc bảng
1. Thêm tệp mới `migrations/000N_ten_thay_doi.sql` (không sửa tệp đã chạy trên production).
2. Thêm tệp đó vào lệnh `db:migrate:*` trong `shop/backend/package.json`.
3. Chạy với `--local`, kiểm thử, rồi chạy với `--remote` **trước khi** deploy code dùng cột/bảng mới.
