INSERT INTO categories (id, name, slug) VALUES 
  (1, 'Điện thoại', 'dien-thoai'),
  (2, 'Laptop', 'laptop'),
  (3, 'Tablet', 'tablet'),
  (4, 'Phụ kiện', 'phu-kien'),
  (5, 'Đồng hồ', 'dong-ho');

INSERT INTO products (id, name, price, original_price, category_id, badge, chip, specs, image_url) VALUES 
  (1, 'iPhone 15 Pro Max', 28990000, 34990000, 1, 'Bán chạy', '⚡ A17 Pro 3nm', '["Camera 48MP 5X", "Khung Titan vũ trụ", "ProMotion 120Hz"]', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80'),
  (2, 'Samsung Galaxy S24 Ultra', 25990000, 31990000, 1, 'Galaxy AI', '🚀 Snapdragon 8 Gen 3', '["Camera 200MP AI", "Bút S-Pen tích hợp", "Màn 2600 nits"]', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80'),
  (3, 'MacBook Air M3', 27490000, 32490000, 2, 'Mới nhất', '✨ Apple M3 Chip', '["Pin bền 18 giờ", "Retina 13.6 inch", "Chỉ nặng 1.24kg"]', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80'),
  (4, 'iPad Pro M4', 23990000, 28990000, 3, 'Siêu mỏng', '🔮 Apple M4 OLED', '["Tandem OLED HDR", "Dày chỉ 5.1mm", "Apple Pencil Pro"]', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80'),
  (5, 'AirPods Pro 2', 5690000, 6790000, 4, 'Âm thanh Pro', '🎧 Apple H2 Audio', '["Chống ồn ANC 2X", "Adaptive Sound", "Cổng USB-C"]', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80'),
  (6, 'Apple Watch Ultra 2', 18990000, 21990000, 5, 'Đỉnh cao', '🧭 Dual-GPS L1/L5', '["Vỏ Titan 49mm", "Màn hình 3000 nits", "Pin tới 72 giờ"]', 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80');

INSERT INTO admin_users (username, password_hash) VALUES 
  ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');
