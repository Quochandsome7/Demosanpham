# shop/ – Mã nguồn Cellphone X

Hướng dẫn đầy đủ (tính năng, cấu trúc thư mục, chạy ở máy, triển khai) nằm ở **[README chính](../README.md)**.

Bắt đầu nhanh:
```bash
npm install && npm run install:all
npm run db:migrate:local && npm run db:seed:local
npm run dev        # API :8787 + giao diện :5173
```

| Thư mục | Nội dung |
|---|---|
| [backend/](backend/) | REST API Hono trên Cloudflare Workers, migration và seed D1 |
| [frontend/](frontend/) | Giao diện SvelteKit, build tĩnh lên Cloudflare Pages |
| [analytics-dashboard/](analytics-dashboard/) | (Tùy chọn) Dashboard Streamlit cho dữ liệu truy cập |
| [docs/](docs/) | Kiến trúc, API, cơ sở dữ liệu, triển khai, chatbot, thống kê |
| [legacy/](legacy/) | Bản thử nghiệm cũ, không còn triển khai |
