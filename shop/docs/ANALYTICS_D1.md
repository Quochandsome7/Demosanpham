# Thu thập dữ liệu truy cập website bằng Cloudflare D1

Ứng dụng trên website **Cellphone X** — https://demosanpham.pages.dev/

Trong website Cellphone X, nhóm dùng Cloudflare để lưu lại một số thông tin khi có người truy cập: họ vào trang nào, xem sản phẩm nào, dùng điện thoại hay máy tính, đến từ quốc gia/thành phố nào và từ nguồn nào. Dữ liệu được ghi vào D1 rồi hiển thị ở trang **Thống kê truy cập** dành cho quản trị viên. Phần dưới đây trình bày cách hệ thống hoạt động và các bước để làm được chức năng này.

---

## 1. Các dịch vụ được sử dụng

Giao diện (SvelteKit) được đưa lên **Cloudflare Pages** tại `demosanpham.pages.dev`. Phần máy chủ là một **Cloudflare Worker** viết bằng Hono, chạy tại `demosanpham.dtc235200623.workers.dev`. Khi cần lưu một hành động của khách, giao diện gửi yêu cầu tới Worker; Worker kiểm tra dữ liệu rồi ghi vào cơ sở dữ liệu **D1** `cellphonex-db`. Trang thống kê đọc lại dữ liệu từ D1 để hiển thị.

Ngoài thống kê, website còn dùng **Workers AI** và **Vectorize** cho chatbot tư vấn sản phẩm. Hai chức năng tách biệt: Workers AI/Vectorize trả lời chatbot, còn Worker + D1 phụ trách ghi nhận, lưu và thống kê lượt truy cập.

### Dữ liệu được thu thập

| Nhóm dữ liệu | Trường và ý nghĩa |
| --- | --- |
| Hành vi | `event`: xem trang, xem sản phẩm, tìm kiếm, thêm giỏ, bắt đầu đặt hàng, đặt hàng thành công. `product_id` khi xem/thêm sản phẩm. |
| Trang và nguồn | `path` là đường dẫn trang (đã bỏ query string); `referrer` chỉ giữ tên miền giới thiệu hoặc `Direct`. |
| Thiết bị | `device` (Desktop / Mobile / Tablet), `browser`, `os` (iOS, Android, Windows, macOS…) suy ra từ User-Agent. |
| Mạng và vị trí | `ip` lấy từ header `CF-Connecting-IP`; `country`, `city` lấy từ `request.cf`. |
| Người truy cập | `visitor_id` là mã ngẫu nhiên lưu trong trình duyệt (không gắn với danh tính), dùng để đếm số người. `user_id` chỉ có khi khách đang đăng nhập. |
| Thời gian | `created_at` do D1 tự tạo (giờ UTC). |

Quốc gia và thành phố chỉ là vị trí gần đúng theo mạng, không phải GPS. Một người có thể dùng nhiều IP và nhiều người có thể dùng chung một IP, vì vậy nhóm đếm "người truy cập" theo `visitor_id` (dự phòng bằng IP nếu thiếu) và hiển thị riêng số IP khác nhau để tham khảo. Cách làm này không dùng Pipeline/Basin, và không lưu nội dung tin nhắn chatbot.

---

## 2. Chuẩn bị và kết nối cơ sở dữ liệu

### Bước 1 — Mã nguồn và website
Mã nguồn nằm ở `D:\Demosanpham`, repository `Quochandsome7/Demosanpham`. Backend ở `shop/backend`, frontend ở `shop/frontend`. Dự án đã có sẵn D1 `cellphonex-db`, nên chỉ cần thêm bảng mới, không tạo database khác.

### Bước 2 — Tạo bảng lưu sự kiện
Chạy tệp `shop/backend/src/db/analytics.sql` (hoặc dán vào mục **Console** của database trên dashboard):

```bash
cd shop/backend
npx wrangler d1 execute cellphonex-db --remote --file=src/db/analytics.sql
```

```sql
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT, device TEXT, browser TEXT, os TEXT,
  ip TEXT, country TEXT, city TEXT,
  visitor_id TEXT, user_id INTEGER, product_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS analytics_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS analytics_event ON analytics_events(event);
```

Mở **Explore Data** để kiểm tra bảng `analytics_events` đã xuất hiện.

### Bước 3 — Liên kết D1 với Worker
Worker đã có binding `DB` trong `shop/backend/wrangler.toml`, nên mã có thể dùng `env.DB` để đọc/ghi:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cellphonex-db"
database_id = "a6093079-830b-41e7-99dc-00f3d3dc5054"
```

Kiểm tra tại **Workers & Pages → demosanpham → Settings → Bindings**: `DB` phải trỏ tới `cellphonex-db`. Sau khi sửa mã, triển khai lại bằng `npm run deploy` trong `shop/backend`.

---

## 3. Ghi sự kiện từ website vào D1

### Bước 4 — Gắn mã thu thập trong giao diện
Tệp `shop/frontend/src/lib/analytics.ts` cung cấp hàm `trackShop(event, extra)` để gọi ở nhiều nơi:

| Sự kiện | Gắn ở đâu |
| --- | --- |
| `page_view` | `+layout.svelte`, mỗi lần chuyển trang (`afterNavigate`), trừ trang admin |
| `product_view` | Trang chi tiết sản phẩm `product/[id]` |
| `search` | Store `searchQuery`, gửi sau **1 giây** kể từ lần gõ cuối (không gửi theo từng ký tự) |
| `add_to_cart` | `cart.addItem()` — áp dụng cho mọi nút thêm giỏ |
| `begin_checkout` | Khi mở trang `checkout` |
| `purchase` | Khi tạo đơn hàng thành công |

```ts
fetch(`${API_BASE}/analytics/event`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    event: "page_view",
    path: location.pathname,
    referrer: document.referrer,
    visitor_id: getVisitorId(),
  }),
  keepalive: true,
});
```

Cuối mỗi trang có thông báo về dữ liệu đang thu thập và nút **Tắt thống kê**. Khi khách tắt, trình duyệt lưu lựa chọn vào localStorage và không gửi sự kiện nào nữa.

### Bước 5 — Nhận và kiểm tra sự kiện ở Worker
Yêu cầu tới `POST /api/v1/analytics/event`, xử lý trong `shop/backend/src/routes/analytics.ts`:
- Chỉ nhận 6 loại sự kiện trong danh sách cho phép; loại khác bị trả lỗi 400.
- `path` phải là đường dẫn nội bộ bắt đầu bằng `/`; bỏ query string, tối đa 200 ký tự.
- `referrer` rút gọn về tên miền; trống hoặc cùng tên miền → `Direct`.
- IP lấy từ `CF-Connecting-IP`, quốc gia/thành phố từ `request.cf` — không tin dữ liệu JavaScript tự khai.
- `user_id` chỉ được ghi khi token khách hàng hợp lệ (`role = customer`).

### Bước 6 — Ghi dữ liệu bằng truy vấn có tham số
Hàm `recordEvent` trong `shop/backend/src/lib/analytics.ts` dùng `env.DB.batch` để ghi sự kiện **và** dọn bản ghi quá 30 ngày trong cùng một lần:

```ts
await env.DB.batch([
  env.DB.prepare(
    `INSERT INTO analytics_events
     (event, path, referrer, device, browser, os, ip, country, city, visitor_id, user_id, product_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(event, path, referrer, device, browser, os, ip, country, city, visitorId, userId, productId),
  env.DB.prepare(`DELETE FROM analytics_events WHERE created_at < datetime('now', ?)`)
    .bind("-30 days"),
]);
```

Khách có thể xem sản phẩm, tìm kiếm và thêm giỏ mà không cần tài khoản, nên hệ thống vẫn ghi được lượt truy cập của khách chưa đăng nhập. Bảng không lưu mật khẩu hay toàn bộ URL giới thiệu.

---

## 4. Hiển thị thống kê cho quản trị viên

`GET /api/v1/analytics/stats?hours=24` (yêu cầu token admin) trả về, trong khoảng thời gian chọn:
- Tổng: số người truy cập, lượt xem trang, số IP khác nhau, tổng sự kiện.
- Số lượng từng loại sự kiện (hành vi khách hàng).
- Phân bố theo quốc gia, thành phố, thiết bị, hệ điều hành, trình duyệt, nguồn truy cập.
- Trang và sản phẩm được xem nhiều nhất; số người truy cập theo từng giờ.

Trang **Admin → Thống kê truy cập** (`/admin/analytics`) hiển thị các số liệu này với bộ lọc **24 giờ / 7 ngày / 30 ngày**.

Kiểm tra nhanh bằng tệp `RestClient/demo.http` (gửi sự kiện → đăng nhập admin → xem thống kê).
