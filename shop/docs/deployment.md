# Hướng dẫn triển khai lên Cloudflare

Tài nguyên dùng trong dự án: Worker **`demosanpham`**, dự án Pages **`demosanpham`**, D1 **`cellphonex-db`**, Vectorize **`cellphonex-products`**, binding Workers AI **`AI`**. Mọi lệnh bên dưới chạy trong thư mục `shop/` trừ khi ghi khác.

## 0. Chuẩn bị
| Yêu cầu | Ghi chú |
|---|---|
| Tài khoản Cloudflare | Gói Free là đủ |
| Node.js ≥ 18 và npm | Kiểm tra: `node -v`, `npm -v` |
| Git | Kiểm tra: `git --version` |

```bash
npm install            # cài concurrently cho lệnh npm run dev
npm run install:all    # cài thư viện cho backend và frontend
```

## 1. Đăng nhập Wrangler
```bash
cd backend
npx wrangler login     # mở trình duyệt, bấm Allow
npx wrangler whoami
```

## 2. Tạo D1 và các bảng
```bash
cd backend
npx wrangler d1 create cellphonex-db
```
Chép `database_id` được in ra vào `shop/backend/wrangler.toml` (mục `[[d1_databases]]`), rồi:
```bash
cd ..                       # về shop/
npm run db:migrate:remote   # tạo 9 bảng
npm run db:seed:remote      # dữ liệu mẫu – CHỈ chạy lần đầu
```
Kiểm tra trên Dashboard: **Storage & databases → D1 SQL Database → cellphonex-db**.

## 3. Tạo chỉ mục Vectorize
```bash
cd backend
npx wrangler vectorize create cellphonex-products --dimensions=1024 --metric=cosine
```
Workers AI không cần tạo tài nguyên, chỉ cần binding `[ai]` trong `wrangler.toml`.

## 4. Cấu hình và triển khai API (Worker)
`shop/backend/wrangler.toml` cần có: `name = "demosanpham"`, binding `DB`, `VECTORIZE`, `AI`, và biến `FRONTEND_URL`, `JWT_SECRET`.

Khuyến nghị lưu khóa JWT dưới dạng secret thay vì để trong `[vars]`:
```bash
cd backend
npx wrangler secret put JWT_SECRET    # rồi xóa dòng JWT_SECRET trong [vars]
```
Triển khai:
```bash
npm run deploy:api
# → https://demosanpham.<tên-tài-khoản>.workers.dev
```

## 5. Nạp vector cho chatbot
Sau lần deploy đầu tiên (hoặc sau khi sửa nhiều sản phẩm bằng SQL):
```bash
curl -X POST "https://demosanpham.dtc235200623.workers.dev/api/v1/chat/reindex" \
     -H "x-reindex-secret: <JWT_SECRET>"
```

## 6. Triển khai giao diện (Pages)
Nếu đổi địa chỉ Worker, sửa `API_BASE` trong `shop/frontend/src/lib/api.ts` và dòng trong `shop/frontend/static/_redirects`.

**Cách 1 – bằng lệnh:**
```bash
npm run deploy:web     # build SvelteKit rồi wrangler pages deploy build --project-name demosanpham
```
**Cách 2 – tự động từ GitHub:** Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → chọn repo, nhánh `main`; *Root directory* `shop/frontend`; *Build command* `npm run build`; *Build output directory* `build`.

## 7. Kiểm tra sau triển khai
- Mở https://demosanpham.pages.dev, xem sản phẩm, thêm giỏ hàng, hỏi chatbot.
- Đăng nhập `/admin/login` (tài khoản mẫu `admin` / `admin123` – **nên đổi mật khẩu**).
- Gọi thử API bằng `shop/backend/tests/api.http`.
- Theo dõi nhật ký: `cd backend && npm run logs` (hoặc tab **Logs/Metrics** của Worker).

## Cập nhật sau khi sửa code
```bash
npm run deploy          # deploy API rồi giao diện
```
Có thay đổi bảng: chạy migration mới với `--remote` **trước** khi deploy (xem [database.md](database.md)).

## Hạn mức gói Free (tham khảo)
| Dịch vụ | Hạn mức |
|---|---|
| Workers | 100.000 yêu cầu/ngày, 10 ms CPU/yêu cầu |
| Pages | 500 lần build/tháng, không giới hạn yêu cầu tệp tĩnh |
| D1 | 5 GB; 5 triệu dòng đọc, 100.000 dòng ghi/ngày |
| Workers AI | 10.000 Neurons/ngày |
| Vectorize | 30 triệu chiều vector truy vấn, 5 triệu chiều lưu trữ/tháng |

Hạn mức có thể thay đổi – xem trang Pricing của Cloudflare.

## Xử lý lỗi thường gặp
| Lỗi | Cách khắc phục |
|---|---|
| `D1_ERROR: no such table` | Chưa tạo bảng trên D1 thật → `npm run db:migrate:remote`; kiểm tra `database_id` trong `wrangler.toml` |
| Trình duyệt báo lỗi CORS | Nguồn gọi không thuộc `localhost`, `*.pages.dev`, `*.workers.dev`, `FRONTEND_URL` → sửa `src/middleware/cors.ts` hoặc biến `FRONTEND_URL`, deploy lại API |
| Chatbot luôn trả lời "không tìm thấy" | Vectorize chưa có vector → bước 5; kiểm tra chỉ mục 1024 chiều |
| Tải lại trang con trên Pages bị 404 | Kiểm tra `fallback: 'index.html'` trong `svelte.config.js` |
| `UNIQUE constraint failed` khi chạy seed | `seeds/0001_seed.sql` chỉ chạy một lần; các seed khác chạy lại được |
| Binding `DB`/`AI`/`VECTORIZE` undefined | Tên binding trong `wrangler.toml` không khớp `src/types.ts` → sửa và deploy lại |
