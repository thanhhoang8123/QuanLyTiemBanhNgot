-- =========================================================
-- DATA MẪU - HỆ THỐNG QUẢN LÝ TIỆM BÁNH NGỌT
-- Theo ERD chính thức gồm 16 bảng
-- Có thể chạy nhiều lần: dùng INSERT IGNORE để tránh lỗi
-- trùng khóa chính khi Spring Boot chạy lại data.sql.
-- =========================================================

-- =========================================================
-- 1. ROLES
-- =========================================================
INSERT IGNORE INTO roles (id, role_code, name, description) VALUES
(1, 'ADMIN', 'Quản trị viên', 'Quản lý toàn bộ hệ thống'),
(2, 'MANAGER', 'Quản lý', 'Quản lý hoạt động cửa hàng'),
(3, 'STAFF', 'Nhân viên bán hàng', 'Tiếp nhận và xử lý đơn hàng');

-- =========================================================
-- 2. ACCOUNTS
-- password_hash dưới đây chỉ là dữ liệu mẫu.
-- Khi làm đăng nhập thật sẽ thay bằng BCrypt hash.
-- =========================================================
INSERT IGNORE INTO accounts
(id, username, password_hash, role_id, status, created_at, updated_at) VALUES
(1, 'admin', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 1, 'ACTIVE', NOW(), NOW()),
(2, 'manager', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 2, 'ACTIVE', NOW(), NOW()),
(3, 'staff01', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 3, 'ACTIVE', NOW(), NOW()),
(4, 'staff02', '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890', 3, 'ACTIVE', NOW(), NOW());

-- =========================================================
-- 3. EMPLOYEES
-- =========================================================
INSERT IGNORE INTO employees
(id, account_id, full_name, phone, email, salary, status) VALUES
(1, 1, 'Nguyễn Văn An', '0901000001', 'an@tiembanh.com', 18000000.00, TRUE),
(2, 2, 'Trần Thị Bình', '0901000002', 'binh@tiembanh.com', 14000000.00, TRUE),
(3, 3, 'Lê Văn Cường', '0901000003', 'cuong@tiembanh.com', 9000000.00, TRUE),
(4, 4, 'Phạm Thị Dung', '0901000004', 'dung@tiembanh.com', 9000000.00, TRUE);

-- =========================================================
-- 4. CUSTOMERS
-- =========================================================
INSERT IGNORE INTO customers
(id, full_name, phone, email, address, loyalty_points, status) VALUES
(1, 'Nguyễn Minh Anh', '0911111111', 'minhanh@gmail.com', 'Quận 1, TP.HCM', 120, TRUE),
(2, 'Trần Quốc Bảo', '0922222222', 'quocbao@gmail.com', 'Quận 3, TP.HCM', 80, TRUE),
(3, 'Lê Ngọc Hân', '0933333333', 'ngochan@gmail.com', 'Quận 10, TP.HCM', 250, TRUE),
(4, 'Phạm Gia Huy', '0944444444', 'giahuy@gmail.com', 'Thủ Đức, TP.HCM', 40, TRUE),
(5, 'Hoàng Thu Trang', '0955555555', 'thutrang@gmail.com', 'Quận 7, TP.HCM', 0, TRUE);

-- =========================================================
-- 5. CATEGORIES
-- =========================================================
INSERT IGNORE INTO categories
(id, name, description, status) VALUES
(1, 'Bánh kem', 'Bánh sinh nhật và bánh kem trang trí', TRUE),
(2, 'Bánh mì', 'Các loại bánh mì dùng hằng ngày', TRUE),
(3, 'Bánh ngọt', 'Bánh ngọt và bánh dùng kèm trà cà phê', TRUE),
(4, 'Bánh quy', 'Các loại bánh quy đóng hộp', TRUE),
(5, 'Bánh mousse', 'Các loại bánh mousse nhiều hương vị', TRUE);

-- =========================================================
-- 6. PRODUCTS
-- =========================================================
INSERT IGNORE INTO products
(id, category_id, product_code, name, description, image_url, price, quantity, unit, expiry_date, status, created_at) VALUES
(1, 1, 'BK001', 'Bánh kem dâu tây', 'Bánh kem dâu tây size 20cm', '/images/products/banh-kem-dau.jpg', 350000.00, 10, 'cái', '2026-10-10', TRUE, NOW()),
(2, 1, 'BK002', 'Bánh kem chocolate', 'Bánh kem chocolate size 20cm', '/images/products/banh-kem-chocolate.jpg', 380000.00, 8, 'cái', '2026-10-10', TRUE, NOW()),
(3, 2, 'BM001', 'Bánh mì bơ tỏi', 'Bánh mì bơ tỏi nướng giòn', '/images/products/banh-mi-bo-toi.jpg', 45000.00, 30, 'cái', '2026-10-05', TRUE, NOW()),
(4, 2, 'BM002', 'Bánh mì xúc xích', 'Bánh mì xúc xích phô mai', '/images/products/banh-mi-xuc-xich.jpg', 40000.00, 25, 'cái', '2026-10-05', TRUE, NOW()),
(5, 3, 'BN001', 'Croissant bơ', 'Bánh croissant nhân bơ truyền thống', '/images/products/croissant.jpg', 35000.00, 20, 'cái', '2026-10-06', TRUE, NOW()),
(6, 3, 'BN002', 'Tiramisu', 'Tiramisu vị cà phê truyền thống', '/images/products/tiramisu.jpg', 65000.00, 15, 'hộp', '2026-10-07', TRUE, NOW()),
(7, 3, 'BN003', 'Bánh su kem', 'Bánh su kem nhân vanilla', '/images/products/su-kem.jpg', 30000.00, 25, 'hộp', '2026-10-06', TRUE, NOW()),
(8, 4, 'BQ001', 'Bánh quy chocolate', 'Bánh quy chocolate chip', '/images/products/quy-chocolate.jpg', 55000.00, 18, 'hộp', '2026-11-01', TRUE, NOW()),
(9, 4, 'BQ002', 'Bánh quy bơ', 'Bánh quy bơ hộp 200g', '/images/products/quy-bo.jpg', 50000.00, 20, 'hộp', '2026-11-01', TRUE, NOW()),
(10, 5, 'BMU001', 'Mousse xoài', 'Bánh mousse xoài tươi', '/images/products/mousse-xoai.jpg', 75000.00, 12, 'hộp', '2026-10-08', TRUE, NOW());

-- =========================================================
-- 7. INGREDIENTS
-- =========================================================
INSERT IGNORE INTO ingredients
(id, ingredient_code, name, unit, stock_quantity, min_stock_level, unit_price, status) VALUES
(1, 'NL001', 'Bột mì', 'kg', 50.000, 10.000, 18000.00, TRUE),
(2, 'NL002', 'Đường', 'kg', 35.000, 8.000, 22000.00, TRUE),
(3, 'NL003', 'Trứng gà', 'quả', 300.000, 50.000, 3500.00, TRUE),
(4, 'NL004', 'Bơ lạt', 'kg', 20.000, 5.000, 160000.00, TRUE),
(5, 'NL005', 'Sữa tươi', 'lít', 30.000, 8.000, 32000.00, TRUE),
(6, 'NL006', 'Chocolate', 'kg', 15.000, 3.000, 220000.00, TRUE),
(7, 'NL007', 'Dâu tây', 'kg', 12.000, 3.000, 90000.00, TRUE),
(8, 'NL008', 'Xoài', 'kg', 10.000, 2.000, 55000.00, TRUE),
(9, 'NL009', 'Phô mai', 'kg', 10.000, 2.000, 180000.00, TRUE),
(10, 'NL010', 'Men bánh mì', 'kg', 5.000, 1.000, 120000.00, TRUE);

-- =========================================================
-- 8. SUPPLIERS
-- =========================================================
INSERT IGNORE INTO suppliers
(id, supplier_code, name, phone, email, address, status) VALUES
(1, 'NCC001', 'Công ty Nguyên Liệu ABC', '0281111111', 'abc@gmail.com', 'Quận 5, TP.HCM', TRUE),
(2, 'NCC002', 'Công ty Thực Phẩm Minh Phát', '0282222222', 'minhphat@gmail.com', 'Quận 6, TP.HCM', TRUE),
(3, 'NCC003', 'Nhà cung cấp Bếp Việt', '0283333333', 'bepviet@gmail.com', 'Quận 11, TP.HCM', TRUE);

-- =========================================================
-- 9. PURCHASE_ORDERS
-- employee_id tham chiếu employees.id
-- =========================================================
INSERT IGNORE INTO purchase_orders
(id, purchase_code, supplier_id, employee_id, order_date, total_amount, status, created_at) VALUES
(1, 'PN001', 1, 2, '2026-09-20 08:30:00', 2880000.00, 'RECEIVED', '2026-09-20 08:30:00'),
(2, 'PN002', 2, 2, '2026-09-22 09:00:00', 2340000.00, 'RECEIVED', '2026-09-22 09:00:00'),
(3, 'PN003', 3, 3, '2026-09-25 10:00:00', 1900000.00, 'PENDING', '2026-09-25 10:00:00');

-- =========================================================
-- 10. PURCHASE_ORDER_ITEMS
-- line_total = quantity * unit_cost
-- =========================================================
INSERT IGNORE INTO purchase_order_items
(id, purchase_order_id, ingredient_id, quantity, unit_cost, line_total) VALUES
(1, 1, 1, 100.000, 18000.00, 1800000.00),
(2, 1, 2, 30.000, 22000.00, 660000.00),
(3, 1, 3, 120.000, 3500.00, 420000.00),
(4, 2, 4, 10.000, 160000.00, 1600000.00),
(5, 2, 5, 20.000, 32000.00, 640000.00),
(6, 2, 6, 5.000, 220000.00, 1100000.00),
(7, 3, 7, 10.000, 90000.00, 900000.00),
(8, 3, 8, 10.000, 55000.00, 550000.00),
(9, 3, 9, 2.500, 180000.00, 450000.00);

-- =========================================================
-- 11. ORDERS
-- total_amount = tổng trước giảm
-- discount_amount = tiền giảm
-- final_amount = total_amount - discount_amount (không lưu DB)
-- =========================================================
INSERT IGNORE INTO orders
(id, order_code, customer_id, employee_id, order_date, delivery_address, delivery_status, total_amount, discount_amount, status, created_at) VALUES
(1, 'DH001', 1, 3, '2026-09-26 09:15:00', NULL, 'NOT_REQUIRED', 380000.00, 0.00, 'COMPLETED', '2026-09-26 09:15:00'),
(2, 'DH002', 2, 4, '2026-09-26 10:30:00', 'Quận 3, TP.HCM', 'DELIVERED', 410000.00, 41000.00, 'COMPLETED', '2026-09-26 10:30:00'),
(3, 'DH003', 3, 3, '2026-09-27 14:00:00', 'Quận 10, TP.HCM', 'PENDING', 750000.00, 75000.00, 'CONFIRMED', '2026-09-27 14:00:00'),
(4, 'DH004', 4, 4, '2026-09-28 16:20:00', NULL, 'NOT_REQUIRED', 200000.00, 0.00, 'COMPLETED', '2026-09-28 16:20:00'),
(5, 'DH005', 5, 3, '2026-09-29 11:10:00', 'Quận 7, TP.HCM', 'PENDING', 350000.00, 35000.00, 'PENDING', '2026-09-29 11:10:00');

-- =========================================================
-- 12. ORDER_ITEMS
-- line_total = quantity * unit_price - discount_amount
-- =========================================================
INSERT IGNORE INTO order_items
(id, order_id, product_id, quantity, unit_price, discount_amount, line_total) VALUES
(1, 1, 2, 1, 380000.00, 0.00, 380000.00),

(2, 2, 1, 1, 350000.00, 35000.00, 315000.00),
(3, 2, 5, 2, 35000.00, 6000.00, 64000.00),
(4, 2, 7, 1, 30000.00, 0.00, 30000.00),

(5, 3, 10, 4, 75000.00, 75000.00, 225000.00),
(6, 3, 6, 2, 65000.00, 0.00, 130000.00),
(7, 3, 8, 5, 55000.00, 0.00, 275000.00),
(8, 3, 9, 2, 50000.00, 0.00, 100000.00),

(9, 4, 3, 2, 45000.00, 0.00, 90000.00),
(10, 4, 4, 2, 40000.00, 0.00, 80000.00),
(11, 4, 7, 1, 30000.00, 0.00, 30000.00),

(12, 5, 1, 1, 350000.00, 35000.00, 315000.00);

-- =========================================================
-- 13. PAYMENTS
-- =========================================================
INSERT IGNORE INTO payments
(id, order_id, payment_method, amount, status, transaction_id, provider, paid_at) VALUES
(1, 1, 'CASH', 380000.00, 'SUCCESS', NULL, NULL, '2026-09-26 09:20:00'),
(2, 2, 'EWALLET', 369000.00, 'SUCCESS', 'MOMO20260926001', 'Momo', '2026-09-26 10:35:00'),
(3, 3, 'CARD', 675000.00, 'SUCCESS', 'CARD20260927001', NULL, '2026-09-27 14:05:00'),
(4, 4, 'CASH', 200000.00, 'SUCCESS', NULL, NULL, '2026-09-28 16:25:00'),
(5, 5, 'EWALLET', 315000.00, 'PENDING', 'ZALO20260929001', 'ZaloPay', NULL);

-- =========================================================
-- 14. CUSTOM_ORDERS
-- =========================================================
INSERT IGNORE INTO custom_orders
(id, customer_id, employee_id, cake_name, request_description, order_date, delivery_date, estimated_price, deposit, status) VALUES
(1, 1, 3, 'Bánh sinh nhật công chúa', 'Bánh 2 tầng, màu hồng, trang trí hình công chúa và ghi chữ Chúc mừng sinh nhật.', '2026-09-25 15:00:00', '2026-10-02 17:00:00', 850000.00, 300000.00, 'CONFIRMED'),
(2, 3, 4, 'Bánh cưới hoa trắng', 'Bánh cưới 3 tầng, trang trí hoa trắng, phong cách tối giản.', '2026-09-26 10:00:00', '2026-10-10 09:00:00', 2500000.00, 1000000.00, 'IN_PROGRESS'),
(3, 5, 3, 'Bánh sinh nhật chocolate', 'Bánh chocolate size 18cm, ghi chữ Happy Birthday.', '2026-09-29 13:30:00', '2026-10-05 16:00:00', 500000.00, 200000.00, 'PENDING');

-- =========================================================
-- 15. PROMOTIONS
-- =========================================================
INSERT IGNORE INTO promotions
(id, promotion_code, name, discount_percent, max_discount, min_order_value, start_date, end_date, status) VALUES
(1, 'KM001', 'Ưu đãi khách hàng mới', 10.00, 50000.00, 200000.00, '2026-01-01', '2026-12-31', TRUE),
(2, 'KM002', 'Khuyến mãi bánh kem', 15.00, 100000.00, 300000.00, '2026-09-01', '2026-10-31', TRUE),
(3, 'KM003', 'Mua bánh nhận ưu đãi', 5.00, 50000.00, 150000.00, '2026-09-15', '2026-10-15', TRUE),
(4, 'KM004', 'Khuyến mãi cuối tuần', 20.00, 80000.00, 250000.00, '2026-10-01', '2026-10-31', TRUE);

-- =========================================================
-- 16. PROMOTION_PRODUCTS
-- Bảng trung gian N-N giữa promotions và products
-- =========================================================
INSERT IGNORE INTO promotion_products
(promotion_id, product_id) VALUES
(1, 1),
(1, 3),
(1, 5),
(2, 1),
(2, 2),
(2, 10),
(3, 5),
(3, 6),
(3, 7),
(3, 8),
(4, 1),
(4, 2),
(4, 6);

-- =========================================================
-- KIỂM TRA NHANH SAU KHI INSERT
-- =========================================================
-- SELECT COUNT(*) FROM roles;
-- SELECT COUNT(*) FROM accounts;
-- SELECT COUNT(*) FROM employees;
-- SELECT COUNT(*) FROM customers;
-- SELECT COUNT(*) FROM categories;
-- SELECT COUNT(*) FROM products;
-- SELECT COUNT(*) FROM ingredients;
-- SELECT COUNT(*) FROM suppliers;
-- SELECT COUNT(*) FROM purchase_orders;
-- SELECT COUNT(*) FROM purchase_order_items;
-- SELECT COUNT(*) FROM orders;
-- SELECT COUNT(*) FROM order_items;
-- SELECT COUNT(*) FROM payments;
-- SELECT COUNT(*) FROM custom_orders;
-- SELECT COUNT(*) FROM promotions;
-- SELECT COUNT(*) FROM promotion_products;
