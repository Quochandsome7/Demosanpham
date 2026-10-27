-- Thêm 20 sản phẩm mới (ảnh để trống — thêm thủ công trong trang admin)
-- Danh mục: 1 = Điện thoại, 2 = Laptop, 5 = Đồng hồ
-- An toàn khi chạy lại: mỗi câu INSERT bỏ qua sản phẩm đã có cùng tên.
--
-- Local:  npx wrangler d1 execute cellphonex-db --local  --file=seeds/0002_seed_20_products.sql
-- Remote: npx wrangler d1 execute cellphonex-db --remote --file=seeds/0002_seed_20_products.sql
-- Sau khi chạy remote, gọi POST /api/v1/chat/reindex để chatbot (Vectorize) nhận sản phẩm mới.


-- ─── I. Điện thoại thông minh ────────────────────────────────────────────

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Samsung Galaxy S26 Ultra', 31990000, 36990000, 1,
         'Galaxy AI', '🚀 Snapdragon 8 Elite Gen 5',
         '["Camera đa tiêu cự", "Bút S Pen tích hợp", "Màn hình lớn"]',
         'Điện thoại Android cao cấp, màn hình lớn, camera đa tiêu cự và bút S Pen. Phù hợp chụp ảnh, làm việc, ghi chú và sử dụng các tính năng AI.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Samsung Galaxy S26 Ultra');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Apple iPhone 17 Pro Max', 34990000, 37990000, 1, 'Mới nhất', '⚡ Apple A19 Pro',
         '["Hiệu năng mạnh", "Màn hình lớn", "Quay video chuyên nghiệp"]',
         'Mẫu iPhone cao cấp với hiệu năng mạnh, màn hình lớn, camera chất lượng và khả năng quay video tốt. Thích hợp cho người dùng cần thiết bị phục vụ công việc lẫn giải trí.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Apple iPhone 17 Pro Max');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Xiaomi 17', 19990000, 22990000, 1, 'Nhỏ gọn', '🔥 Snapdragon 8 Elite Gen 5',
         '["Thiết kế dễ cầm", "Màn hình chất lượng", "Sạc nhanh"]',
         'Điện thoại nhỏ gọn hơn dòng Ultra, cấu hình mạnh, màn hình chất lượng và sạc nhanh. Đáng cân nhắc nếu muốn hiệu năng cao trong thiết kế dễ cầm.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Xiaomi 17');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Samsung Galaxy A56 5G', 8990000, 10490000, 1, 'Giá tốt', '📶 Kết nối 5G',
         '["Màn hình AMOLED", "Camera đủ dùng", "Thiết kế hiện đại"]',
         'Điện thoại tầm trung có màn hình AMOLED, kết nối 5G, camera đủ dùng và thiết kế hiện đại. Phù hợp học sinh, sinh viên hoặc người dùng cần điện thoại ổn định.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Samsung Galaxy A56 5G');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Google Pixel 10', 19990000, 22990000, 1, 'Camera AI', '🧠 Google Tensor G5',
         '["Xử lý ảnh thông minh", "Chụp chân dung đẹp", "Android gần nguyên bản"]',
         'Điểm nổi bật là khả năng xử lý ảnh, chụp chân dung và trải nghiệm Android gần nguyên bản. Hợp với người thích chụp ảnh và phần mềm thông minh.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Google Pixel 10');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Nothing Phone (3)', 21990000, 24990000, 1, 'Cá tính', '💡 Snapdragon 8s Gen 4',
         '["Mặt lưng Glyph đặc trưng", "Giao diện tối giản", "Hiệu năng cao cấp"]',
         'Thiết kế khác biệt với mặt lưng đặc trưng, giao diện tối giản và hiệu năng hướng đến phân khúc cao cấp. Phù hợp người thích sản phẩm có cá tính.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Nothing Phone (3)');

-- ─── II. Laptop ──────────────────────────────────────────────────────────

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Apple MacBook Air M5 13 inch', 29999000, 33390000, 2, 'Mỏng nhẹ', '✨ Apple M5',
         '["Liquid Retina 13 inch", "Vỏ nhôm mỏng nhẹ", "Pin dùng cả ngày"]',
         'Trang bị chip M5, màn hình Liquid Retina 13 inch, thiết kế nhôm mỏng nhẹ và thời lượng pin dài. Phù hợp học tập, lập trình, văn phòng và chỉnh sửa hình ảnh.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Apple MacBook Air M5 13 inch');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Acer Swift Go 14 AI', 23990000, 27990000, 2, 'Laptop AI', '🤖 Tính năng AI',
         '["Màn hình OLED 14 inch", "Mỏng nhẹ", "Đa nhiệm mượt"]',
         'Laptop mỏng nhẹ với màn hình OLED, cấu hình hướng đến đa nhiệm và các tính năng AI. Thích hợp cho sinh viên, người thường xuyên di chuyển hoặc làm việc văn phòng.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Acer Swift Go 14 AI');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Lenovo LOQ Essential 15', 18590000, 20450000, 2, 'Gaming', '🎮 NVIDIA RTX 3050',
         '["Màn hình 15.6 inch", "144Hz (tùy cấu hình)", "Đồ họa 3D cơ bản"]',
         'Laptop gaming trang bị card đồ họa RTX 3050, màn hình 144Hz ở một số cấu hình và khả năng xử lý trò chơi phổ biến. Phù hợp chơi game, học thiết kế 3D cơ bản và làm việc đồ họa.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Lenovo LOQ Essential 15');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'ASUS Vivobook 14', 10990000, 12560000, 2, 'Tiết kiệm', '💼 Học tập & văn phòng',
         '["Màn hình 14 inch", "Thiết kế gọn", "Học online mượt"]',
         'Laptop phổ thông với màn hình 14 inch, thiết kế gọn, phù hợp soạn thảo tài liệu, học trực tuyến, lướt web và các phần mềm văn phòng. Đây là lựa chọn tiết kiệm nếu nhu cầu không quá nặng.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'ASUS Vivobook 14');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Apple MacBook Neo 13 inch', 17090000, 20790000, 2, 'Giá mềm', '✨ Apple A18 Pro',
         '["Màn hình 13 inch", "Chạy macOS", "Nhỏ gọn"]',
         'Dòng MacBook có mức giá dễ tiếp cận hơn, sử dụng chip A18 Pro, thiết kế nhỏ gọn và chạy macOS. Phù hợp học tập, làm việc văn phòng và người muốn bước vào hệ sinh thái Apple.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Apple MacBook Neo 13 inch');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'ASUS Zenbook S14', 28990000, NULL, 2, 'Cao cấp', '💎 Màn hình OLED',
         '["Siêu mỏng nhẹ", "Màn hình OLED đẹp", "Hiệu năng & di động"]',
         'Laptop cao cấp có thiết kế mỏng nhẹ, màn hình OLED và cấu hình hướng đến hiệu năng lẫn tính di động. Phù hợp người làm việc chuyên nghiệp, cần màn hình đẹp và thiết bị dễ mang theo.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'ASUS Zenbook S14');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'HP OmniBook Ultra Flip 14', 36890000, NULL, 2, '2 trong 1', '🔄 Xoay gập 360°',
         '["OLED cảm ứng", "Dùng như máy tính bảng", "Thiết kế cao cấp"]',
         'Laptop 2 trong 1 với màn hình cảm ứng có thể xoay gập, thiết kế cao cấp và màn hình OLED. Có thể dùng như laptop hoặc máy tính bảng, phù hợp ghi chú, thuyết trình và sáng tạo nội dung.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'HP OmniBook Ultra Flip 14');

-- ─── III. Đồng hồ thông minh ─────────────────────────────────────────────

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Apple Watch Series 11', 10790000, NULL, 5, 'Cao cấp', '❤️ Theo dõi sức khỏe',
         '["Màn hình sáng", "Theo dõi luyện tập", "Nhận thông báo"]',
         'Đồng hồ cao cấp của Apple với màn hình sáng, theo dõi sức khỏe và hoạt động thể chất. Phù hợp người dùng iPhone muốn nhận thông báo, theo dõi luyện tập và các chỉ số sức khỏe hằng ngày.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Apple Watch Series 11');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Apple Watch SE 3', 5990000, NULL, 5, 'Giá tốt', '⌚ watchOS',
         '["Nhận thông báo", "Theo dõi vận động", "Sức khỏe cơ bản"]',
         'Mẫu Apple Watch có giá dễ tiếp cận hơn, cung cấp tính năng thông báo, theo dõi vận động và sức khỏe cơ bản. Lựa chọn hợp lý cho người dùng iPhone không cần dòng cao cấp.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Apple Watch SE 3');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Samsung Galaxy Watch8', 5490000, 7190000, 5, 'Wear OS', '⌚ Wear OS',
         '["Hỗ trợ ứng dụng", "Theo dõi giấc ngủ", "Theo dõi vận động"]',
         'Đồng hồ chạy Wear OS, hỗ trợ ứng dụng, theo dõi giấc ngủ, vận động và sức khỏe. Phù hợp người dùng điện thoại Android, đặc biệt là Samsung Galaxy.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Samsung Galaxy Watch8');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Samsung Galaxy Watch Ultra (2025)', 10790000, 11790000, 5, 'Bền bỉ', '📶 Hỗ trợ LTE',
         '["Thiết kế chắc chắn", "Kết nối LTE", "Tính năng ngoài trời"]',
         'Phiên bản đồng hồ cao cấp, thiết kế chắc chắn, hỗ trợ LTE và nhiều tính năng dành cho hoạt động ngoài trời. Thích hợp cho người tập luyện thường xuyên hoặc cần đồng hồ bền bỉ.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Samsung Galaxy Watch Ultra (2025)');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Huawei Watch Fit 5', 2990000, NULL, 5, 'Pin trâu', '🏃 Thể thao',
         '["Màn hình lớn", "Đo nhịp tim", "Theo dõi giấc ngủ"]',
         'Đồng hồ màn hình lớn, thiết kế nhẹ, hỗ trợ theo dõi hoạt động thể chất, nhịp tim và giấc ngủ. Đáng cân nhắc nếu muốn đồng hồ đẹp, pin tốt và không cần quá nhiều ứng dụng.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Huawei Watch Fit 5');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Huawei Watch GT 6 Pro', 7490000, NULL, 5, 'Sang trọng', '💎 Vỏ Titanium',
         '["Chất liệu titanium", "Pin dài ngày", "Chế độ luyện tập"]',
         'Đồng hồ có thiết kế cao cấp, chất liệu titanium ở phiên bản Pro, theo dõi sức khỏe và hoạt động thể thao. Phù hợp người thích đồng hồ sang trọng, pin dài và các tính năng tập luyện.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Huawei Watch GT 6 Pro');

INSERT INTO products (name, price, original_price, category_id, badge, chip, specs, description)
SELECT 'Xiaomi Watch S5', 4690000, NULL, 5, 'Đa dụng', '⌚ Mặt tròn',
         '["Màn hình đẹp", "Theo dõi sức khỏe", "Luyện tập thể thao"]',
         'Đồng hồ thông minh có thiết kế mặt tròn, màn hình đẹp, hỗ trợ theo dõi sức khỏe và luyện tập thể thao. Phù hợp người dùng điện thoại Xiaomi hoặc Android cần một mẫu đồng hồ đa dụng.'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Xiaomi Watch S5');
