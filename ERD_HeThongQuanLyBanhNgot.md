# ERD – Hệ thống quản lý bánh ngọt

> Tài liệu thiết kế CSDL chính thức của nhóm. 

**Quy ước đặt tên:** tiếng Anh, `snake_case`, bảng số nhiều (`products`, `orders`...). Khóa chính luôn là `id BIGINT`. Khóa ngoại đặt tên `<ten_bang_so_it>_id`.

**Quy ước trạng thái:**
- Dùng `BOOLEAN` khi chỉ có 2 trạng thái (bật/tắt, hoạt động/ngừng)
- Dùng `VARCHAR` khi có từ 3 trạng thái trở lên (ví dụ đơn hàng: PENDING, CONFIRMED, DELIVERED, CANCELLED)

---

## Mục lục

1. [Accounts & Staff](#1-accounts--staff)
2. [Customers](#2-customers)
3. [Product Catalog](#3-product-catalog)
4. [Ingredients](#4-ingredients)
5. [Supplier & Purchasing](#5-supplier--purchasing)
6. [Orders & Sales](#6-orders--sales)
7. [Custom Orders](#7-custom-orders)
8. [Promotion](#8-promotion)
9. [Bảng tổng hợp](#bảng-tổng-hợp-16-bảng)

---

## 1. Accounts & Staff

### `roles`
Danh sách vai trò trong hệ thống (Admin, Quản lý, Nhân viên bán hàng...).

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| role_code | VARCHAR(50) | Mã vai trò, VD: `ADMIN`, `MANAGER`, `STAFF` |
| name | VARCHAR(100) | Tên hiển thị |
| description | VARCHAR(255) | Mô tả |

### `accounts`
Tài khoản đăng nhập hệ thống.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| username | VARCHAR(50) | Duy nhất |
| password_hash | VARCHAR(255) | Mật khẩu đã mã hóa |
| role_id | BIGINT | FK → `roles.id` |
| status | VARCHAR(20) | ACTIVE / LOCKED |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `employees`
Hồ sơ nhân sự, gắn 1-1 với tài khoản đăng nhập.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| account_id | BIGINT | FK → `accounts.id` (1-1) |
| full_name | VARCHAR(100) | |
| phone | VARCHAR(15) | |
| email | VARCHAR(100) | |
| salary | DECIMAL(15,2) | |
| status | BOOLEAN | Đang làm việc / đã nghỉ |

**Quan hệ:** `roles` (1) — (N) `accounts` — (1) — (1) `employees`

---

## 2. Customers

### `customers`
Khách hàng mua bánh.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| full_name | VARCHAR(100) | |
| phone | VARCHAR(15) | |
| email | VARCHAR(100) | |
| address | VARCHAR(255) | |
| loyalty_points | INT | Điểm tích lũy |
| status | BOOLEAN | |

---

## 3. Product Catalog

### `categories`
Danh mục sản phẩm (Bánh kem, Bánh mì, Bánh quy...).

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| name | VARCHAR(100) | |
| description | VARCHAR(255) | |
| status | BOOLEAN | |

### `products`
Sản phẩm bán trong tiệm.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| category_id | BIGINT | FK → `categories.id` |
| product_code | VARCHAR(30) | Mã sản phẩm |
| name | VARCHAR(150) | Tên sản phẩm |
| description | TEXT | |
| image_url | VARCHAR(500) | Đường dẫn ảnh sản phẩm |
| price | DECIMAL(15,2) | |
| quantity | INT | Số lượng tồn |
| unit | VARCHAR(30) | Đơn vị tính (cái, hộp...) |
| expiry_date | DATE | Hạn sử dụng |
| status | BOOLEAN | |
| created_at | TIMESTAMP | |

**Quan hệ:** `categories` (1) — (N) `products`

---

## 4. Ingredients

### `ingredients`
Nguyên liệu làm bánh, tồn kho quản lý trực tiếp trên bảng này (đã gộp, không tách lô/lịch sử giao dịch).

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| ingredient_code | VARCHAR(30) | |
| name | VARCHAR(150) | |
| unit | VARCHAR(30) | Đơn vị tính (kg, lít...) |
| stock_quantity | DECIMAL(15,3) | Số lượng tồn kho hiện tại |
| min_stock_level | DECIMAL(15,3) | Ngưỡng cảnh báo tồn kho thấp |
| unit_price | DECIMAL(15,2) | Giá nhập gần nhất |
| status | BOOLEAN | |

> Khi nhập hàng (`purchase_order_items`), cộng thêm vào `stock_quantity`. Đây là cách đơn giản hóa phù hợp quy mô đồ án, không quản lý theo lô/hạn dùng riêng từng đợt nhập.

---

## 5. Supplier & Purchasing

### `suppliers`
Nhà cung cấp nguyên liệu.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| supplier_code | VARCHAR(30) | |
| name | VARCHAR(150) | |
| phone | VARCHAR(15) | |
| email | VARCHAR(100) | |
| address | VARCHAR(255) | |
| status | BOOLEAN | |

### `purchase_orders`
Phiếu nhập hàng từ nhà cung cấp.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| purchase_code | VARCHAR(30) | |
| supplier_id | BIGINT | FK → `suppliers.id` |
| employee_id | BIGINT | FK → `employees.id` (người lập phiếu) |
| order_date | TIMESTAMP | |
| total_amount | DECIMAL(15,2) | |
| status | VARCHAR(30) | PENDING / RECEIVED / CANCELLED |
| created_at | TIMESTAMP | |

### `purchase_order_items`
Chi tiết từng nguyên liệu trong phiếu nhập.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| purchase_order_id | BIGINT | FK → `purchase_orders.id` |
| ingredient_id | BIGINT | FK → `ingredients.id` |
| quantity | DECIMAL(15,3) | |
| unit_cost | DECIMAL(15,2) | |
| line_total | DECIMAL(15,2) | = quantity × unit_cost |

**Quan hệ:** `suppliers` (1) — (N) `purchase_orders` (1) — (N) `purchase_order_items` (N) — (1) `ingredients`

---

## 6. Orders & Sales

### `orders`
Đơn hàng/hóa đơn bán bánh. Đã gộp thông tin giao hàng vào đây thay vì tách bảng riêng.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| order_code | VARCHAR(30) | |
| customer_id | BIGINT | FK → `customers.id` |
| employee_id | BIGINT | FK → `employees.id` (người lập đơn) |
| order_date | TIMESTAMP | |
| delivery_address | VARCHAR(255) | NULL nếu khách mua tại quầy |
| delivery_status | VARCHAR(30) | NOT_REQUIRED / PENDING / DELIVERED |
| total_amount | DECIMAL(15,2) | Tổng tiền trước giảm giá |
| discount_amount | DECIMAL(15,2) | Số tiền được giảm (tính từ khuyến mãi áp dụng) |
| status | VARCHAR(30) | PENDING / CONFIRMED / COMPLETED / CANCELLED |
| created_at | TIMESTAMP | |

> Tổng tiền sau giảm giá (`final_amount`) không lưu cứng trong CSDL — tính toán ở tầng code Java: `final_amount = total_amount - discount_amount`, để tránh dữ liệu trùng lặp/lệch nhau.

### `order_items`
Chi tiết sản phẩm trong đơn hàng.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| order_id | BIGINT | FK → `orders.id` |
| product_id | BIGINT | FK → `products.id` |
| quantity | INT | |
| unit_price | DECIMAL(15,2) | |
| discount_amount | DECIMAL(15,2) | |
| line_total | DECIMAL(15,2) | |

### `payments`
Thanh toán cho đơn hàng.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| order_id | BIGINT | FK → `orders.id` |
| payment_method | VARCHAR(30) | Phân loại thanh toán — `CASH`, `CARD`, `EWALLET` |
| amount | DECIMAL(15,2) | |
| status | VARCHAR(30) | PENDING / SUCCESS / FAILED |
| transaction_id | VARCHAR(150) | Chỉ dùng khi `payment_method` = CARD hoặc EWALLET |
| provider | VARCHAR(100) | Chỉ dùng khi `payment_method` = EWALLET (Momo, ZaloPay...) |
| paid_at | TIMESTAMP | |

**Quan hệ:** `customers` (1) — (N) `orders` (1) — (N) `order_items` (N) — (1) `products`; `orders` (1) — (0..1) `payments`.

Mỗi Order có thể chưa có Payment; một Payment phải thuộc về đúng một Order; mỗi Order không được có nhiều hơn một Payment.

---

## 7. Custom Orders

### `custom_orders`
Đơn đặt bánh theo yêu cầu riêng (bánh sinh nhật, bánh cưới...).

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| customer_id | BIGINT | FK → `customers.id` |
| employee_id | BIGINT | FK → `employees.id` (người tiếp nhận) |
| cake_name | VARCHAR(150) | |
| request_description | TEXT | Mô tả yêu cầu (hình dạng, chữ viết, trang trí...) |
| order_date | TIMESTAMP | |
| delivery_date | TIMESTAMP | Ngày hẹn giao |
| estimated_price | DECIMAL(15,2) | |
| deposit | DECIMAL(15,2) | Tiền cọc |
| status | VARCHAR(30) | PENDING / CONFIRMED / IN_PROGRESS / COMPLETED / CANCELLED |

---

## 8. Promotion

### `promotions`
Chương trình khuyến mãi.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| id | BIGINT | PK |
| promotion_code | VARCHAR(30) | |
| name | VARCHAR(100) | |
| discount_percent | DECIMAL(5,2) | |
| max_discount | DECIMAL(15,2) | Số tiền giảm tối đa |
| min_order_value | DECIMAL(15,2) | Giá trị đơn hàng tối thiểu để áp dụng |
| start_date | DATE | |
| end_date | DATE | |
| status | BOOLEAN | |

### `promotion_products`
Bảng trung gian (N-N): 1 khuyến mãi áp dụng cho nhiều sản phẩm, 1 sản phẩm có thể thuộc nhiều khuyến mãi.

| Cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|
| promotion_id | BIGINT | PK, FK → `promotions.id` |
| product_id | BIGINT | PK, FK → `products.id` |

---

## Bảng tổng hợp (16 bảng)

| # | Bảng | Module |
|---|---|---|
| 1 | roles | Accounts & Staff |
| 2 | accounts | Accounts & Staff |
| 3 | employees | Accounts & Staff |
| 4 | customers | Customers |
| 5 | categories | Product Catalog |
| 6 | products | Product Catalog |
| 7 | ingredients | Ingredients |
| 8 | suppliers | Supplier & Purchasing |
| 9 | purchase_orders | Supplier & Purchasing |
| 10 | purchase_order_items | Supplier & Purchasing |
| 11 | orders | Orders & Sales |
| 12 | order_items | Orders & Sales |
| 13 | payments | Orders & Sales |
| 14 | custom_orders | Custom Orders |
| 15 | promotions | Promotion |
| 16 | promotion_products | Promotion |

---

