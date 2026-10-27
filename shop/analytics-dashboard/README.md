# Báo cáo lượt truy cập website Cellphone X bằng Streamlit

Dashboard Streamlit đọc dữ liệu truy cập của website [Cellphone X](https://demosanpham.pages.dev/) từ bảng Iceberg mà Cloudflare Pipeline (Basin) ghi vào R2, rồi hiển thị số người truy cập theo thời gian, quốc gia, thiết bị và hành vi.

## 1. Luồng dữ liệu

```
Website (trackShop)  →  Worker POST /api/v1/analytics/event  →  D1: analytics_events
                                                                    │
                                   shop/backend/scripts/push-to-pipeline.mjs
                                                                    ▼
                                   Pipeline ingest (f8fb6f6f….ingest.cloudflare.com)
                                                                    ▼
                                          R2 bucket – bảng Iceberg (Basin)
                                                                    ▼
                                   Streamlit: shop/analytics-dashboard/app.py
```

Mỗi bản ghi trên stream có các trường:

| Trường    | Ý nghĩa                                                                                       |
| --------- | --------------------------------------------------------------------------------------------- |
| `id`      | Mã người truy cập ẩn danh (visitor_id lưu trong trình duyệt)                                  |
| `country` | Mã quốc gia, lấy từ `request.cf.country`                                                      |
| `device`  | `ios`, `android`, `pc` hoặc `other`                                                           |
| `time`    | Thời điểm truy cập, millisecond (UTC)                                                         |
| `ip`      | IP từ header `CF-Connecting-IP`                                                               |
| `meta`    | `site`, `event_id`, `event`, `path`, `referrer`, `device_type`, `os`, `browser`, `city`, `user_id`, `product_id` |

## 2. Cấu hình kết nối (`.env`)

Tạo file `shop/analytics-dashboard/.env` (đã nằm trong `.gitignore`, không commit):

```env
R2_ACCOUNT_ID=<account_id>
R2_BUCKET=<bucket mà sink của Pipeline ghi vào>
R2_ACCESS_KEY_ID=<access key của R2 API token>
R2_SECRET_ACCESS_KEY=<secret key của R2 API token>
# Tuỳ chọn
ICEBERG_TABLE_PREFIX=   # đường dẫn bảng trong bucket, khi bucket có nhiều bảng
SITE_ID=cellphonex      # giá trị meta.site dùng để nhận diện dữ liệu của website
USE_SAMPLE=0            # 1 = dùng dữ liệu mẫu để xem giao diện
```

Token R2 chỉ cần quyền **Object Read** trên bucket. App đọc bảng qua S3 API và file `*.metadata.json` mới nhất (`pyiceberg.StaticTable`), nên không cần quyền Data Catalog.

## 3. Chạy dashboard

```bash
cd shop/analytics-dashboard
pip install -r requirements.txt
streamlit run app.py
```

Mở `http://localhost:8501`. Thanh bên trái có các bộ lọc:

- **Khoảng thời gian**: 24 giờ, 7 ngày, 30 ngày hoặc tất cả.
- **Phạm vi dữ liệu**: chỉ website Cellphone X, hoặc toàn bộ stream.
- **Ẩn bản ghi thử nghiệm**: bỏ các bản ghi có cờ test hoặc mốc thời gian trước năm 2020 (thường do gửi `time` bằng giây).
- **Tải lại dữ liệu**: dữ liệu được cache 5 phút; nút này đọc lại ngay.

## 4. Nội dung báo cáo

- Người truy cập (số `id` khác nhau), lượt xem trang, số IP khác nhau, số quốc gia.
- Người truy cập theo giờ (khi xem 24 giờ) hoặc theo ngày.
- Bảng và biểu đồ theo quốc gia, theo thiết bị.
- Hành vi: xem trang, xem sản phẩm, tìm kiếm, thêm giỏ, bắt đầu đặt hàng, đặt hàng thành công.
- Thành phố, trình duyệt, nguồn truy cập, trang được xem nhiều nhất.
- Bảng dữ liệu chi tiết (giờ Việt Nam).

## 5. Lưu ý về dữ liệu

- **Stream dùng chung với nhóm khác.** Bảng Iceberg chứa cả dữ liệu của các nhóm 01, 04, 05, 07… App nhận diện bản ghi của Cellphone X bằng `meta.site = "cellphonex"`. Với các bản ghi đã đẩy trước khi có trường `site`, app dựa vào việc không có `site`, có `device_type`, và `event_id` là số nguyên (id dòng trong D1).
- **Đẩy trùng:** nếu chạy lại `push-to-pipeline.mjs`, app tự bỏ bản ghi trùng theo `event_id`.
- **Dữ liệu chưa tự cập nhật:** website hiện chỉ ghi vào D1. Muốn dashboard có số mới, chạy lại script đẩy dữ liệu, hoặc sửa Worker để ghi đồng thời D1 và Pipeline.
- Vị trí suy ra từ IP nên chỉ gần đúng. Lưu IP là dữ liệu cá nhân, chỉ chia sẻ dashboard trong nhóm.

## 6. Lỗi thường gặp

| Lỗi                                      | Cách xử lý                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| "Thiếu tham số kết nối…"                 | Điền đủ 4 biến `R2_*` trong `.env`                                         |
| "Không tìm thấy file *.metadata.json"    | Sai `R2_BUCKET` hoặc `ICEBERG_TABLE_PREFIX`; kiểm tra sink của Pipeline    |
| 403 / AccessDenied                       | Token R2 chưa có quyền đọc bucket                                          |
| "Không có lượt truy cập nào trong …"     | Chọn khoảng thời gian dài hơn, hoặc đẩy dữ liệu mới từ D1 lên Pipeline     |
