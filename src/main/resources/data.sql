INSERT IGNORE INTO suppliers
(id, supplier_code, name, phone, email, address, status)
VALUES
(1, 'NCC001', 'Công ty Nguyên Liệu ABC', '0901234567', 'abc@gmail.com', 'TP. Hồ Chí Minh', true),
(2, 'NCC002', 'Nhà cung cấp Minh Phát', '0912345678', 'minhphat@gmail.com', 'Bình Dương', true);

INSERT IGNORE INTO ingredients
(id, ingredient_code, name, unit, stock_quantity, min_stock_level, unit_price, status)
VALUES
(1, 'NL001', 'Bột mì', 'kg', 50.000, 10.000, 25000.00, true),
(2, 'NL002', 'Đường trắng', 'kg', 30.000, 5.000, 20000.00, true),
(3, 'NL003', 'Trứng gà', 'quả', 200.000, 50.000, 3500.00, true),
(4, 'NL004', 'Bơ lạt', 'kg', 20.000, 5.000, 120000.00, true);

INSERT IGNORE INTO purchase_orders
(id, purchase_code, supplier_id, employee_id, order_date, total_amount, status, created_at)
VALUES
(1, 'PN001', 1, 1, '2026-10-01 08:00:00', 1250000.00, 'COMPLETED', '2026-10-01 08:00:00'),
(2, 'PN002', 2, 1, '2026-10-01 09:00:00', 800000.00, 'COMPLETED', '2026-10-01 09:00:00');

INSERT IGNORE INTO purchase_order_items
(id, purchase_order_id, ingredient_id, quantity, unit_cost, line_total)
VALUES
(1, 1, 1, 20.000, 25000.00, 500000.00),
(2, 1, 2, 25.000, 20000.00, 500000.00),
(3, 1, 3, 50.000, 3500.00, 175000.00),
(4, 2, 4, 6.667, 120000.00, 800040.00);