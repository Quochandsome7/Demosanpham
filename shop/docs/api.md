# Tài liệu API

- **Địa chỉ gốc:** `https://demosanpham.dtc235200623.workers.dev/api/v1` (production) · `http://127.0.0.1:8787/api/v1` (chạy ở máy)
- **Định dạng phản hồi:** `{ "success": true|false, "data": …, "error": "…", "meta": { "page", "limit", "total", "totalPages" } }`
- **Xác thực quản trị:** header `Authorization: Bearer <JWT>` lấy từ `POST /auth/login`.
- **Phiên ẩn danh (giỏ hàng, yêu thích):** header `x-session-id: <uuid>`.
- Thử nhanh bằng tiện ích REST Client của VS Code: [`shop/backend/tests/api.http`](../backend/tests/api.http).

Ký hiệu quyền: 🌐 công khai · 👤 khách hàng đăng nhập · 🔒 quản trị (JWT).

## Sản phẩm – `routes/products.ts`
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/products?q=&category_id=&page=1&limit=12` | Danh sách sản phẩm đang bán (`limit` tối đa 100). Thêm `include_inactive=1` + JWT để lấy cả sản phẩm ngừng bán | 🌐 |
| GET | `/products/:id` | Chi tiết sản phẩm (`specs` trả về dạng mảng/JSON) | 🌐 |
| POST | `/products` | Thêm sản phẩm. Body: `name, price, original_price, image_url, description, category_id, badge, chip, specs, stock, is_active` | 🔒 |
| PUT | `/products/:id` | Sửa các trường gửi lên; tự cập nhật vector chatbot | 🔒 |
| DELETE | `/products/:id` | Xóa mềm (`is_active = 0`) và xóa vector | 🔒 |

## Danh mục – `routes/categories.ts`
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/categories` | Danh sách danh mục | 🌐 |
| POST | `/categories` | Body: `name, slug, icon` | 🔒 |
| PUT | `/categories/:id` | Body: `name, slug, icon` | 🔒 |
| DELETE | `/categories/:id` | Xóa danh mục | 🔒 |

## Giỏ hàng – `routes/cart.ts` (theo phiên)
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/cart` | Các sản phẩm trong giỏ | 🌐 |
| POST | `/cart` | Body: `product_id, quantity` (cộng dồn nếu đã có) | 🌐 |
| PUT | `/cart/:itemId` | Body: `quantity` | 🌐 |
| DELETE | `/cart/:itemId` | Xóa khỏi giỏ | 🌐 |

## Sản phẩm yêu thích – `routes/wishlist.ts` (theo `x-session-id`)
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| GET | `/wishlist` | Danh sách yêu thích | 🌐 |
| POST | `/wishlist` | Body: `product_id` | 🌐 |
| DELETE | `/wishlist/:productId` | Bỏ yêu thích | 🌐 |
| GET | `/wishlist/check/:productId` | Kiểm tra đã yêu thích chưa | 🌐 |

## Đơn hàng – `routes/orders.ts`
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/orders` | Tạo đơn. Body: `customer {name, phone, email, address}`, `items [{product_id, quantity, price}]`, `shipping_address, phone, note, payment_method (cod\|vietqr\|wallet), bank_or_wallet`. Xóa giỏ của phiên `x-session-id` | 🌐 |
| GET | `/orders?page=1&limit=10` | Danh sách đơn kèm tên khách | 🔒 |
| GET | `/orders/:id` | Chi tiết đơn + sản phẩm | 🔒 |
| PUT | `/orders/:id` | Body: `status` (`pending`, `confirmed`, `shipping`, `delivered`, `cancelled`) | 🔒 |

## Khách hàng & xác thực
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/auth/login` | Đăng nhập quản trị. Body: `username, password` → `{ token, user }` | 🌐 |
| GET | `/auth/me` | Thông tin quản trị viên từ token | 🔒 |
| POST | `/customer-auth/register` | Body: `name, phone, password (≥ 6 ký tự), email?, address?` → `{ token, user }` | 🌐 |
| POST | `/customer-auth/login` | Body: `identifier (email hoặc SĐT), password` | 🌐 |
| GET / PUT | `/customer-auth/me` | Xem / cập nhật `name, phone, email, address` | 👤 |
| GET | `/customers?page=1&limit=10` | Danh sách khách hàng + số đơn | 🔒 |
| GET | `/customers/:id` | Chi tiết khách hàng + lịch sử đơn | 🔒 |

## Chatbot – `routes/chat.ts`
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/chat` | Body: `message` (≤ 500 ký tự) → `{ answer, sources[] }` | 🌐 |
| POST | `/chat/reindex` | Nhúng lại toàn bộ sản phẩm vào Vectorize. Header `x-reindex-secret: <JWT_SECRET>` hoặc `Authorization` | 🔒 |

## Thống kê truy cập – `routes/analytics.ts`
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/analytics/event` | Body: `event` (`page_view`, `product_view`, `search`, `add_to_cart`, `begin_checkout`, `purchase`), `path`, `referrer`, `visitor_id`, `product_id?` | 🌐 |
| GET | `/analytics/stats?hours=24` | Tổng hợp theo khoảng thời gian (tối đa 30 ngày) | 🔒 |

## Khác
| Phương thức | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/upload` | Kiểm tra đường dẫn ảnh. Body: `url` (chưa lưu file lên R2) | 🌐 |
| GET | `/` (ngoài `/api/v1`) | Kiểm tra Worker đang chạy | 🌐 |
