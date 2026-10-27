# Kiến trúc hệ thống

Cellphone X gồm **hai ứng dụng triển khai riêng** trên Cloudflare, giao tiếp với nhau qua HTTPS.

```
                 ┌──────────────────────── Cloudflare Edge (HTTPS, chống DDoS, CDN) ────────────────────────┐
 Trình duyệt ──► │  Cloudflare Pages                         Worker "demosanpham" (Hono)                     │
 (khách hàng,    │  demosanpham.pages.dev     ── /api/* ──►  demosanpham.dtc235200623.workers.dev/api/v1     │
  quản trị viên) │  SvelteKit build tĩnh (SPA)                │            │               │               │
                 │                                            ▼            ▼               ▼               │
                 │                                       D1 (DB)     Workers AI (AI)   Vectorize          │
                 │                                    cellphonex-db  bge-m3, llama 3.3  cellphonex-products │
                 └──────────────────────────────────────────────────────────────────────────────────────────┘
```

## Thành phần

| Thành phần | Thư mục | Công nghệ | Triển khai |
|---|---|---|---|
| Giao diện khách hàng + quản trị | `shop/frontend/` | SvelteKit 2 (Svelte 5 runes), TailwindCSS, `adapter-static` (SPA, fallback `index.html`) | Cloudflare Pages, dự án `demosanpham` |
| REST API | `shop/backend/` | Hono 4 + TypeScript trên Cloudflare Workers | Worker `demosanpham` |
| Cơ sở dữ liệu | `shop/backend/migrations/` | Cloudflare D1 (SQLite) | Database `cellphonex-db` |
| Chatbot tư vấn | `shop/backend/src/lib/rag.ts`, `routes/chat.ts` | Workers AI + Vectorize (RAG) | Cùng Worker |
| Dashboard thống kê (tùy chọn) | `shop/analytics-dashboard/` | Python + Streamlit, đọc bảng Iceberg trên R2 | Chạy ở máy |

## Binding của Worker (`shop/backend/wrangler.toml`)

| Binding | Loại | Tài nguyên |
|---|---|---|
| `DB` | D1 | `cellphonex-db` |
| `AI` | Workers AI | — |
| `VECTORIZE` | Vectorize | `cellphonex-products` (1024 chiều, cosine) |
| `JWT_SECRET`, `FRONTEND_URL` | Biến `[vars]` | Khóa ký JWT, địa chỉ giao diện (dùng cho CORS) |

## Luồng chính

**Gọi API từ giao diện.** `shop/frontend/src/lib/api.ts` là lớp gọi API duy nhất: chạy trên `localhost` thì dùng đường dẫn tương đối `/api/v1` (Vite proxy sang `127.0.0.1:8787`), chạy trên Pages thì gọi thẳng địa chỉ `workers.dev`. Tệp `static/_redirects` cũng chuyển `/api/*` sang Worker. Mọi phản hồi có dạng `{ success, data?, error?, meta? }`.

**Phiên ẩn danh.** Giỏ hàng (`cart_items`) và sản phẩm yêu thích (`wishlist_items`) lưu theo `session_id`, không theo tài khoản. Vì giao diện và API khác tên miền, mã phiên được lưu ở `localStorage` và gửi kèm header `x-session-id` (`credentials: "include"`).

**Xác thực.** `src/utils.ts` tự cài đặt JWT HS256 và băm mật khẩu SHA-256 bằng Web Crypto API. Quản trị viên đăng nhập qua `/auth/login` (bảng `admin_users`); khách hàng qua `/customer-auth/*` (bảng `customers`, JWT có `role: "customer"`). `middleware/auth.ts` kiểm tra chữ ký JWT cho các API quản trị.

**Chatbot RAG** (`POST /api/v1/chat`) – chi tiết ở [chatbot-rag.md](chatbot-rag.md):
1. Lọc ý định bằng regex: chào hỏi, chính sách, thanh toán, liên hệ… trả lời ngay, không gọi AI.
2. Nhúng câu hỏi bằng `@cf/baai/bge-m3` → tìm 4 vector gần nhất trong Vectorize (giữ điểm ≥ 0,40 và không thấp hơn điểm cao nhất quá 0,12); không có kết quả thì tìm theo từ khóa trong D1.
3. Lấy giá, tồn kho, thông số mới nhất từ D1 → `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (temperature 0,2) sinh câu trả lời.
4. Không tìm thấy sản phẩm phù hợp → trả lời từ chối, không gọi mô hình.

Thêm/sửa/xóa sản phẩm trong `routes/products.ts` tự cập nhật vector tương ứng (`executionCtx.waitUntil`).

**Thống kê truy cập** – chi tiết ở [analytics.md](analytics.md): giao diện gửi 6 loại sự kiện tới `/analytics/event`; Worker suy ra thiết bị từ User-Agent, IP từ `CF-Connecting-IP`, vị trí từ `request.cf`, ghi vào `analytics_events` và xóa bản ghi cũ hơn 30 ngày trong cùng một lô lệnh.

## Hạn chế đã biết
- API quản trị chỉ kiểm tra chữ ký JWT, chưa kiểm tra vai trò (token khách hàng cùng khóa ký).
- Khi tạo đơn, tổng tiền tính theo giá trình duyệt gửi lên và chưa trừ tồn kho.
- Mật khẩu băm SHA-256 chưa có salt; `JWT_SECRET` đang để trong `[vars]`.
- Ảnh sản phẩm là đường dẫn ngoài (`products.image_url`), chưa dùng R2.
