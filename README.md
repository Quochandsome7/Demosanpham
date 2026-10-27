# 🛒 Cellphone X – Website bán hàng công nghệ trên Cloudflare

Website thương mại điện tử bán điện thoại, laptop, tablet, phụ kiện và đồng hồ, chạy **hoàn toàn serverless trên Cloudflare**: giao diện **SvelteKit** trên **Cloudflare Pages**, REST API **Hono** trên **Cloudflare Workers**, dữ liệu trên **D1**, chatbot tư vấn bằng **Workers AI + Vectorize** (RAG).

| | Địa chỉ |
|---|---|
| 🌐 Website | https://demosanpham.pages.dev |
| 🔧 Trang quản trị | https://demosanpham.pages.dev/admin/login |
| 📡 API | https://demosanpham.dtc235200623.workers.dev/api/v1 |

> Đề tài *“Triển khai website bán hàng trên dịch vụ điện toán đám mây Cloudflare”* – Nhóm 04, môn Điện toán đám mây, Trường ĐH Công nghệ Thông tin và Truyền thông – ĐH Thái Nguyên. GVHD: TS. Nguyễn Đức Bình.

---

## Mục lục
1. [Tính năng](#1-tính-năng)
2. [Công nghệ](#2-công-nghệ)
3. [Cấu trúc thư mục](#3-cấu-trúc-thư-mục)
4. [Chạy ở máy cá nhân](#4-chạy-ở-máy-cá-nhân)
5. [Kiểm tra](#5-kiểm-tra)
6. [Triển khai lên Cloudflare](#6-triển-khai-lên-cloudflare)
7. [Tài liệu chi tiết](#7-tài-liệu-chi-tiết)
8. [Xử lý lỗi thường gặp](#8-xử-lý-lỗi-thường-gặp)
9. [Hạn chế đã biết](#9-hạn-chế-đã-biết)
10. [Thành viên](#10-thành-viên)

---

## 1. Tính năng

### Khách hàng
- **Trang chủ (`/`)**: banner, dải khuyến mãi, danh mục và lưới sản phẩm; thanh lọc một hàng (từ khóa, danh mục, khoảng giá, sắp xếp); ô tìm kiếm gợi ý tức thì, gõ có dấu hoặc không dấu.
- **Chi tiết sản phẩm (`/product/:id`)**: ảnh, giá bán/giá gốc, chip, thông số, tồn kho, mô tả; nút Thêm vào giỏ, Mua ngay, Yêu thích.
- **Giỏ hàng (`/cart` + ngăn kéo) và Thanh toán (`/checkout`)**: COD, chuyển khoản **VietQR** (MB Bank, Vietcombank, Techcombank, BIDV, VPBank) hoặc ví điện tử (MoMo, VNPay, ZaloPay, ViettelPay).
- **Sản phẩm yêu thích (`/wishlist`)**: lưu theo phiên, không cần đăng nhập.
- **Đăng ký / đăng nhập** bằng số điện thoại hoặc email; **trang chính sách** (`/page/:slug`): đổi trả, bảo hành, vận chuyển, FAQ.
- **Chatbot tư vấn AI**: hỏi bằng tiếng Việt tự nhiên, trả lời dựa trên dữ liệu sản phẩm thật, kèm thẻ sản phẩm.

### Quản trị (`/admin`)
- Tổng quan; quản lý **sản phẩm** (thêm/sửa/ẩn, phân trang, tìm kiếm), **danh mục**, **đơn hàng** (lọc, xem chi tiết, chuyển trạng thái), **khách hàng** (lịch sử đơn).
- **Thống kê truy cập** (`/admin/analytics`): người truy cập, lượt xem, thiết bị, quốc gia/thành phố, nguồn truy cập, sản phẩm xem nhiều – lọc 24 giờ / 7 ngày / 30 ngày.

---

## 2. Công nghệ

| Lớp | Công nghệ | Dịch vụ Cloudflare |
|---|---|---|
| Giao diện | SvelteKit 2 (Svelte 5), TailwindCSS 3, Vite 6, `adapter-static` | **Pages** |
| API | Hono 4, TypeScript | **Workers** |
| Cơ sở dữ liệu | SQLite – 9 bảng | **D1** (`cellphonex-db`) |
| Chatbot | RAG: `@cf/baai/bge-m3` (nhúng) + `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (sinh) | **Workers AI**, **Vectorize** (`cellphonex-products`) |
| Xác thực | JWT HS256, băm mật khẩu bằng Web Crypto API | – |
| Công cụ | Wrangler CLI 3, Node.js ≥ 18 | – |
| Dashboard thống kê (tùy chọn) | Python, Streamlit, PyIceberg | R2 + Pipelines |

---

## 3. Cấu trúc thư mục

```text
Demosanpham/
├── README.md                        # Tài liệu này
└── shop/                            # Toàn bộ mã nguồn dự án
    ├── package.json                 # Lệnh chung: dev, db:*, deploy:*
    │
    ├── backend/                     # REST API – Hono trên Cloudflare Workers
    │   ├── src/
    │   │   ├── index.ts             # Điểm vào Worker, gắn các route vào /api/v1
    │   │   ├── routes/              # products, categories, cart, wishlist, orders, customers,
    │   │   │                        # auth (quản trị), customerAuth, chat (RAG), analytics, upload
    │   │   ├── lib/                 # rag.ts (Workers AI + Vectorize), analytics.ts (ghi sự kiện)
    │   │   ├── middleware/          # auth.ts (kiểm tra JWT), cors.ts
    │   │   ├── types.ts             # Kiểu dữ liệu + binding (DB, AI, VECTORIZE)
    │   │   └── utils.ts             # JWT, băm mật khẩu, tiện ích
    │   ├── migrations/              # SQL tạo bảng – chạy theo thứ tự 0001 → 0003
    │   ├── seeds/                   # Dữ liệu mẫu: danh mục, sản phẩm, tài khoản admin
    │   ├── scripts/                 # Nạp vector sản phẩm, đẩy dữ liệu thống kê sang Pipeline
    │   ├── tests/api.http           # Bộ yêu cầu thử API (VS Code REST Client)
    │   ├── .dev.vars.example        # Mẫu biến môi trường khi chạy ở máy
    │   └── wrangler.toml            # Cấu hình Worker: D1, Workers AI, Vectorize, biến
    │
    ├── frontend/                    # Giao diện – SvelteKit, build tĩnh lên Cloudflare Pages
    │   ├── src/
    │   │   ├── routes/              # Trang khách hàng (/, product, cart, checkout, wishlist, page)
    │   │   │   └── admin/           # Trang quản trị (login, products, categories, orders,
    │   │   │                        # customers, analytics)
    │   │   └── lib/
    │   │       ├── api.ts           # Lớp gọi API duy nhất
    │   │       ├── analytics.ts     # Gửi sự kiện truy cập
    │   │       ├── components/      # ui/ (Header, ProductCard, ChatWidget, CartDrawer…) và admin/
    │   │       └── stores/          # cart, wishlist, auth, customerAuth, products, toast
    │   ├── static/                  # Logo, ảnh ngân hàng/ví, _redirects (/api/* → Worker)
    │   ├── svelte.config.js         # adapter-static, fallback index.html (SPA)
    │   └── vite.config.ts           # Proxy /api → 127.0.0.1:8787 khi chạy ở máy
    │
    ├── analytics-dashboard/         # (Tùy chọn) Dashboard Streamlit đọc thống kê từ R2/Iceberg
    │   ├── app.py
    │   ├── requirements.txt
    │   ├── .env.example
    │   └── README.md
    │
    ├── docs/                        # Tài liệu kỹ thuật
    │   ├── architecture.md          # Kiến trúc, binding, các luồng chính
    │   ├── api.md                   # Danh sách API, tham số, quyền
    │   ├── database.md              # Bảng dữ liệu, migration, seed
    │   ├── deployment.md            # Hướng dẫn triển khai từng bước
    │   ├── chatbot-rag.md           # Chatbot RAG với Workers AI + Vectorize
    │   └── analytics.md             # Thu thập và thống kê truy cập bằng D1
    │
    └── legacy/                      # Bản thử nghiệm cũ, không còn triển khai
```

---

## 4. Chạy ở máy cá nhân

**Yêu cầu:** Node.js ≥ 18, npm, Git, tài khoản Cloudflare (Workers AI và Vectorize luôn gọi tài nguyên thật nên cần đăng nhập Wrangler).

```bash
# 1. Lấy mã nguồn
git clone https://github.com/Quochandsome7/Demosanpham.git
cd Demosanpham/shop

# 2. Cài thư viện
npm install
npm run install:all

# 3. Biến môi trường cho API (tùy chọn – mặc định lấy từ wrangler.toml)
cp backend/.dev.vars.example backend/.dev.vars

# 4. Đăng nhập Cloudflare
cd backend && npx wrangler login && cd ..

# 5. Tạo bảng và dữ liệu mẫu trên D1 cục bộ
npm run db:migrate:local
npm run db:seed:local          # chỉ chạy lần đầu

# 6. Chạy cả API và giao diện
npm run dev
```

| Địa chỉ | Nội dung |
|---|---|
| http://localhost:5173 | Giao diện khách hàng |
| http://localhost:5173/admin/login | Trang quản trị – tài khoản mẫu `admin` / `admin123` |
| http://localhost:8787/api/v1/products | API |

> Chatbot cần chỉ mục Vectorize có dữ liệu; khi chạy ở máy, để thử đầy đủ có thể dùng `npx wrangler dev --remote` trong `backend/`.

### Các lệnh npm (chạy trong `shop/`)
| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy API (`:8787`) và giao diện (`:5173`) cùng lúc |
| `npm run db:migrate:local` / `db:migrate:remote` | Tạo bảng trên D1 cục bộ / D1 thật |
| `npm run db:seed:local` / `db:seed:remote` | Nạp dữ liệu mẫu |
| `npm run build:web` | Build giao diện ra `frontend/build` |
| `npm run deploy:api` / `deploy:web` / `deploy` | Triển khai API / giao diện / cả hai |
| `cd backend && npm run logs` | Xem nhật ký Worker thời gian thực |

---

## 5. Kiểm tra

Dự án chưa có bộ kiểm thử tự động. Cách kiểm tra hiện tại:
- **Build giao diện:** `npm run build:web` phải thành công.
- **Kiểm tra kiểu backend:** `cd backend && npm run typecheck` (hiện còn một số lỗi kiểu đã biết trong `routes/cart.ts`, `routes/products.ts`; không ảnh hưởng việc deploy vì Wrangler không kiểm tra kiểu).
- **Thử API:** mở [`shop/backend/tests/api.http`](shop/backend/tests/api.http) bằng tiện ích REST Client của VS Code.
- **Thử thủ công:** tìm kiếm, thêm giỏ, đặt hàng, hỏi chatbot, đăng nhập quản trị, đổi trạng thái đơn, xem thống kê.

---

## 6. Triển khai lên Cloudflare

Hướng dẫn đầy đủ: [`shop/docs/deployment.md`](shop/docs/deployment.md). Tóm tắt:

```bash
cd shop/backend
npx wrangler login
npx wrangler d1 create cellphonex-db                       # chép database_id vào wrangler.toml
npx wrangler vectorize create cellphonex-products --dimensions=1024 --metric=cosine
npx wrangler secret put JWT_SECRET                         # khuyến nghị: thay cho [vars]
cd ..
npm run db:migrate:remote
npm run db:seed:remote                                     # chỉ lần đầu
npm run deploy                                             # deploy API rồi giao diện
curl -X POST "https://demosanpham.dtc235200623.workers.dev/api/v1/chat/reindex" \
     -H "x-reindex-secret: <JWT_SECRET>"                   # nạp vector cho chatbot
```

---

## 7. Tài liệu chi tiết

| Tài liệu | Nội dung |
|---|---|
| [architecture.md](shop/docs/architecture.md) | Kiến trúc, binding, luồng gọi API, xác thực, chatbot, thống kê |
| [api.md](shop/docs/api.md) | Toàn bộ endpoint `/api/v1`, tham số, quyền truy cập |
| [database.md](shop/docs/database.md) | 9 bảng D1, quan hệ, migration và seed |
| [deployment.md](shop/docs/deployment.md) | Triển khai từng bước, hạn mức gói Free, xử lý lỗi |
| [chatbot-rag.md](shop/docs/chatbot-rag.md) | Chatbot RAG: BGE-M3, Vectorize, Llama 3.3 70B |
| [analytics.md](shop/docs/analytics.md) | Thu thập và thống kê truy cập bằng D1 |
| [analytics-dashboard/README.md](shop/analytics-dashboard/README.md) | Dashboard Streamlit (tùy chọn) |

---

## 8. Xử lý lỗi thường gặp

| Lỗi | Cách khắc phục |
|---|---|
| `D1_ERROR: no such table` | Chạy `npm run db:migrate:local` (ở máy) hoặc `db:migrate:remote` (production); kiểm tra `database_id` |
| Lỗi CORS trên trình duyệt | Nguồn gọi phải là `localhost`, `*.pages.dev`, `*.workers.dev` hoặc `FRONTEND_URL` |
| Chatbot luôn trả lời "không tìm thấy" | Chưa nạp vector → gọi `/api/v1/chat/reindex` |
| `UNIQUE constraint failed` khi seed | `seeds/0001_seed.sql` chỉ chạy một lần |
| Tải lại trang con trên Pages bị 404 | Giữ `fallback: 'index.html'` trong `svelte.config.js` |

Xem thêm trong [deployment.md](shop/docs/deployment.md#xử-lý-lỗi-thường-gặp).

---

## 9. Hạn chế đã biết
- Thanh toán chuyển khoản/ví mới hiển thị mã QR, chưa có xác nhận tự động.
- Khi tạo đơn, máy chủ dùng giá do trình duyệt gửi lên và chưa trừ tồn kho.
- API quản trị chỉ kiểm tra chữ ký JWT, chưa kiểm tra vai trò; mật khẩu băm SHA-256 chưa có salt; `JWT_SECRET` đang nằm trong `wrangler.toml`.
- Ảnh sản phẩm là đường dẫn ngoài, chưa lưu trên R2; chưa có tên miền riêng và chưa kiểm thử tải.

---

## 10. Thành viên

| Thành viên | Vai trò |
|---|---|
| Nguyễn Anh Quốc | Nhóm trưởng – Backend & DevOps: thiết kế hệ thống, D1, API Hono, chatbot RAG, triển khai |
| Đỗ Thị Thùy Dung | Frontend khách hàng: trang chủ, sản phẩm, giỏ hàng, thanh toán, chatbot, responsive |
| Nguyễn Thành Điềm | Frontend quản trị & Kiểm thử: trang quản trị, thống kê truy cập, kiểm thử |

📍 Cửa hàng mẫu: TP. Thái Nguyên · ☎ 0969610085
