<div align="center">

# 🍰 WA PATISSERIE

### HỆ THỐNG QUẢN LÝ VÀ BÁN HÀNG TIỆM BÁNH NGỌT

**Sweet Moments, Fresh Every Day**

<p>
  <a href="https://github.com/thanhhoang8123/QuanLyTiemBanhNgot">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub Repository">
  </a>
  <a href="https://quanlytiembanhngot.onrender.com">
    <img src="https://img.shields.io/badge/Live-Demo-46A758?style=for-the-badge&logo=render" alt="Live Demo">
  </a>
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21">
  <img src="https://img.shields.io/badge/Spring_Boot-4.1.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
</p>

**Đồ án môn học Lập trình Java · Nhóm 04 · Lớp CCQ2411C**

</div>

---

## 📌 Giới thiệu

**WA Patisserie** là hệ thống quản lý và bán hàng dành cho tiệm bánh ngọt, được xây dựng nhằm số hóa các hoạt động kinh doanh từ bán hàng trực tuyến, bán hàng tại quầy đến quản lý và vận hành cửa hàng.

Dự án phát triển theo mô hình **Frontend – Backend** độc lập. Backend sử dụng **Java 21 và Spring Boot**, cung cấp RESTful API và xử lý nghiệp vụ; Frontend sử dụng **React 19 và Vite** để xây dựng giao diện tương tác. Dữ liệu nghiệp vụ được lưu trữ bằng **MySQL**, trong khi **MongoDB** phục vụ lưu nhật ký hoạt động và lịch sử trạng thái đơn hàng.

### ✨ Điểm nổi bật

- 🛍️ Cửa hàng trực tuyến: xem bánh, tìm kiếm, giỏ hàng và đặt hàng.
- 🧾 POS: hỗ trợ nhân viên bán hàng và thanh toán tại quầy.
- 🎂 Custom Cake: tiếp nhận yêu cầu đặt bánh theo thiết kế riêng.
- 📦 Inventory: quản lý nguyên liệu, nhà cung cấp và nhập kho.
- 💳 Payment: tích hợp VNPay Sandbox và thanh toán tiền mặt.
- 🔐 Security: xác thực Session, phân quyền RBAC, CSRF và BCrypt.
- 📊 Management: quản lý hoạt động cửa hàng và theo dõi nhật ký hệ thống.

> **Lưu ý về trạng thái:** README mô tả phạm vi, kiến trúc và các thành phần được ghi nhận trong báo cáo đồ án. Một số luồng nghiệp vụ đã có giao diện hoặc mã nguồn nhưng chưa được kiểm thử end-to-end trên production; trạng thái cụ thể được nêu tại mục [Kiểm thử và giới hạn hiện tại](#-kiểm-thử-và-giới-hạn-hiện-tại).

---

## 🎓 Thông tin đồ án

| Hạng mục | Nội dung |
|:--|:--|
| **Tên đề tài** | Hệ thống quản lý và bán hàng tiệm bánh ngọt WA Patisserie |
| **Môn học** | Lập trình Java |
| **Trường** | Trường Cao đẳng Công Thương |
| **Khoa** | Công nghệ Thông tin |
| **Lớp** | CCQ2411C |
| **Nhóm** | Nhóm 04 |
| **Giảng viên hướng dẫn** | Nguyễn Minh Tuấn |
| **Thời gian thực hiện** | Tháng 10/2026 |

### 👨‍💻 Thành viên thực hiện

| STT | Thành viên | MSSV | Phụ trách chính |
|:--:|:--|:--:|:--|
| 01 | **Lê Thanh Hoàng** | `2124110130` | Khách hàng, bán hàng, thanh toán, đơn bánh đặt riêng và khuyến mãi |
| 02 | **Trần Thị Thảo Như** | `2124110075` | Nguyên liệu, nhà cung cấp, nhập hàng và tồn kho |
| 03 | **Võ Thị Thúy An** | `2124110097` | Tài khoản, nhân viên, danh mục và sản phẩm |

**Đại diện nhóm:** Lê Thanh Hoàng.

---

## 🧰 Công nghệ sử dụng

### Backend

| Công nghệ | Phiên bản | Vai trò |
|:--|:--:|:--|
| Java JDK | 21 LTS | Ngôn ngữ và nền tảng Backend |
| Spring Boot | 4.1.1 | Xây dựng ứng dụng và REST API |
| Spring WebMVC | Theo Spring Boot BOM | Tiếp nhận và xử lý HTTP Request |
| Spring Security | Theo Spring Boot BOM | Xác thực, phân quyền và bảo vệ ứng dụng |
| Spring Data JPA | Theo Spring Boot BOM | Truy cập dữ liệu quan hệ |
| Hibernate | Theo Spring Boot BOM | ORM và ánh xạ Entity |
| Spring Data MongoDB | Theo Spring Boot BOM | Làm việc với MongoDB |
| Spring Validation | Theo Spring Boot BOM | Kiểm tra dữ liệu đầu vào |
| Apache Maven | 3.9+ | Quản lý dependencies và build |
| Flyway | Maven plugin 12.4.0 | Quản lý database migration |

### Frontend

| Công nghệ | Phiên bản | Vai trò |
|:--|:--:|:--|
| React | 19 | Xây dựng giao diện theo component |
| React Router | 7 | Điều hướng trang |
| Vite | 7 | Development server và build tool |
| Tailwind CSS | 4 | Thiết kế giao diện |
| JavaScript / JSX | — | Logic và cấu trúc giao diện |

### Database & dịch vụ tích hợp

| Công nghệ / Dịch vụ | Mục đích sử dụng |
|:--|:--|
| MySQL 8.4.11 (Aiven production) | Dữ liệu nghiệp vụ quan hệ |
| MongoDB (Atlas production) | Activity Logs và Order Status History |
| VNPay Sandbox | Tích hợp thanh toán trực tuyến |
| Cloudinary | Lưu trữ hình ảnh |
| Spring Boot Mail / SMTP | Gửi email |
| Tawk.to | Hỗ trợ khách hàng trực tuyến |
| Render | Triển khai Frontend và Backend |
| Git & GitHub | Quản lý mã nguồn và làm việc nhóm |

---

## 🏛️ Kiến trúc hệ thống

Dự án áp dụng **Layered Architecture** ở Backend và mô hình **Client – Server** giữa Frontend và Backend.

```text
┌──────────────────────────────────────────────┐
│                 CLIENT SIDE                  │
│            React 19 + Vite 7                 │
│                                              │
│     Storefront  │  POS  │  Admin Dashboard   │
└──────────────────────┬───────────────────────┘
                       │ HTTP / JSON
                       ▼
┌──────────────────────────────────────────────┐
│              SPRING BOOT BACKEND             │
│                                              │
│                 Controller                   │
│                     │                        │
│                  Service                     │
│                     │                        │
│                 Repository                   │
│                     │                        │
│        Entity / DTO / Security / Config      │
└──────────────────────┬───────────────────────┘
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
┌────────────────────┐  ┌────────────────────┐
│       MySQL        │  │      MongoDB       │
│                    │  │                    │
│ Business Data      │  │ Activity Logs      │
│ Orders & Payments  │  │ Order Status       │
│ Products & Stock   │  │ History            │
└────────────────────┘  └────────────────────┘
```

### Trách nhiệm các tầng Backend

| Thành phần | Trách nhiệm |
|:--|:--|
| **Controller** | Tiếp nhận request, kiểm tra đầu vào ở mức API và trả response |
| **Service** | Xử lý logic và quy tắc nghiệp vụ |
| **Repository** | Truy vấn và thao tác dữ liệu |
| **Entity** | Ánh xạ dữ liệu với các bảng/collection |
| **DTO** | Đóng gói dữ liệu trao đổi giữa Client và Server |
| **Config** | Cấu hình ứng dụng, bảo mật và tích hợp |

### Mô hình lưu trữ dữ liệu

Dự án sử dụng mô hình **Polyglot Persistence**:

- **MySQL:** lưu dữ liệu nghiệp vụ quan hệ và các giao dịch cần đảm bảo tính toàn vẹn.
- **MongoDB:** lưu nhật ký hoạt động và lịch sử thay đổi trạng thái đơn hàng.

Theo báo cáo, thiết kế gồm **19 bảng MySQL** và **2 collection MongoDB**. Collection MongoDB không phải bảng quan hệ và không tham gia khóa ngoại MySQL.

---

## 🛍️ Các phân hệ chức năng

### 1. Storefront – Cửa hàng trực tuyến

| Chức năng | Mô tả |
|:--|:--|
| Tài khoản khách hàng | Đăng ký, đăng nhập và quản lý hồ sơ |
| Danh mục bánh | Duyệt danh mục và danh sách sản phẩm |
| Tìm kiếm | Tìm bánh theo tên |
| Chi tiết sản phẩm | Xem thông tin, giá bán và hạn sử dụng |
| Giỏ hàng | Thêm, xóa và cập nhật số lượng |
| Đặt hàng online | Nhập thông tin nhận hàng và gửi yêu cầu đặt hàng |
| Thanh toán | Hỗ trợ tiền mặt theo nghiệp vụ và VNPay Sandbox |
| Custom Cake | Chọn kích thước, số tầng, cốt bánh, nhân bánh và ảnh mẫu |
| Lịch sử đơn hàng | Tra cứu đơn hàng và trạng thái |
| Loyalty | Tích lũy điểm theo số tiền thanh toán thành công |
| Hỗ trợ | Live Chat và gửi liên hệ |
| Newsletter | Đăng ký nhận thông tin ưu đãi |

### 2. POS – Bán hàng tại quầy

- Hiển thị danh mục và sản phẩm bánh.
- Tìm kiếm sản phẩm nhanh.
- Thêm sản phẩm vào giỏ hàng POS.
- Hỗ trợ khách vãng lai và khách thành viên.
- Nhận diện nhân viên đang đăng nhập.
- Thanh toán tiền mặt và tính tiền thừa.
- Hỗ trợ in hóa đơn.
- Cập nhật tồn kho theo nghiệp vụ thanh toán.

### 3. Admin Dashboard – Quản trị cửa hàng

| Phân hệ | Chức năng chính |
|:--|:--|
| Dashboard | Theo dõi doanh thu, đơn hàng và cảnh báo |
| Sản phẩm | Quản lý thông tin, giá, hình ảnh và trạng thái |
| Danh mục | Quản lý danh mục bánh |
| Đơn hàng | Tra cứu và xử lý đơn hàng |
| Đơn bánh riêng | Tiếp nhận và xử lý yêu cầu Custom Cake |
| Nguyên liệu | Quản lý danh sách và số lượng tồn |
| Nhà cung cấp | Quản lý thông tin nhà cung cấp |
| Phiếu nhập | Tạo phiếu và xác nhận nhập kho |
| Khuyến mãi | Cấu hình mã giảm giá và điều kiện áp dụng |
| Tài khoản | Quản lý người dùng và vai trò |
| Nhật ký | Tra cứu Activity Logs và Order Status History |

---

## 🔐 Phân quyền người dùng (RBAC)

Hệ thống sử dụng **Role-Based Access Control** thông qua Spring Security.

| Vai trò | Phạm vi quyền |
|:--|:--|
| **ADMIN** | Quản trị tài khoản, phân quyền, cấu hình và nhật ký kiểm toán |
| **MANAGER** | Quản lý cửa hàng, sản phẩm, kho, nhập hàng và nghiệp vụ quản lý |
| **STAFF** | Bán hàng POS và xử lý nghiệp vụ được cấp quyền |
| **CUSTOMER** | Mua hàng, thanh toán, quản lý hồ sơ và theo dõi đơn hàng |

Quyền truy cập được kiểm soát ở Backend. Việc ẩn/hiện menu trên giao diện không thay thế cho kiểm tra quyền tại API.

### Các cơ chế bảo mật được sử dụng

- Session-based Authentication.
- Role-Based Access Control (RBAC).
- CSRF Token.
- BCrypt Password Hashing.
- Validation dữ liệu đầu vào.
- Kiểm soát truy cập tài nguyên theo vai trò.

---

## 🗄️ Thiết kế cơ sở dữ liệu

### Các bảng MySQL

| Nhóm dữ liệu | Bảng |
|:--|:--|
| Tài khoản & nhân sự | `roles`, `accounts`, `employees`, `customers` |
| Liên hệ | `contact_messages`, `newsletter_subscriptions` |
| Sản phẩm | `categories`, `products` |
| Khuyến mãi | `promotions`, `promotion_products` |
| Đơn hàng | `orders`, `order_items` |
| Thanh toán | `payments`, `payment_transaction_attempts` |
| Đặt bánh riêng | `custom_orders` |
| Nhà cung cấp & nhập hàng | `suppliers`, `purchase_orders`, `purchase_order_items` |
| Nguyên liệu | `ingredients` |

### MongoDB Collections

| Collection | Nội dung |
|:--|:--|
| `activity_logs` | Nhật ký thao tác của người dùng và quản trị |
| `order_status_history` | Lịch sử thay đổi trạng thái đơn hàng |

### Một số quan hệ dữ liệu chính

- `Account` – `Role`: nhiều tài khoản thuộc một vai trò.
- `Employee` – `Account`: quan hệ một-một theo `account_id` có UNIQUE.
- `Product` – `Category`: nhiều sản phẩm thuộc một danh mục.
- `Order` – `Customer`: nhiều đơn hàng thuộc một khách hàng.
- `Order` – `OrderItem`: một đơn hàng có nhiều chi tiết.
- `Payment` – `Order`: quan hệ một-một.
- `Payment` – `PaymentTransactionAttempt`: một thanh toán có thể có nhiều lần thử.
- `Promotion` – `Product`: quan hệ nhiều-nhiều qua `promotion_products`.
- `PurchaseOrder` – `Supplier`: nhiều phiếu nhập thuộc một nhà cung cấp.

---

## ⚙️ Kỹ thuật và nghiệp vụ nổi bật

### 1. Idempotency Pattern – Chống tạo đơn trùng

Hệ thống sử dụng khóa `customer_request_key` để nhận diện yêu cầu đặt hàng. Khi Client gửi lại request với cùng khóa, Backend kiểm tra yêu cầu đã được xử lý hay chưa nhằm hạn chế tạo nhiều đơn hàng trùng lặp.

### 2. Pessimistic Locking – Khóa bi quan

Sử dụng `PESSIMISTIC_WRITE` của JPA trong nghiệp vụ cập nhật điểm thưởng, nhằm hạn chế xung đột khi nhiều giao dịch cùng cập nhật dữ liệu của một khách hàng.

### 3. Transaction Management

Sử dụng transaction cho các nghiệp vụ cần duy trì tính toàn vẹn dữ liệu như xử lý đơn hàng, thanh toán và nhập kho.

### 4. MongoDB After Commit

Sử dụng `TransactionSynchronization` để ghi nhật ký MongoDB sau khi transaction MySQL commit thành công.

> Theo mô tả mã nguồn trong báo cáo, callback hiện ghi trực tiếp sau commit; chưa sử dụng executor bất đồng bộ tại callback. Nếu cần độ tin cậy cao hơn, có thể nghiên cứu thêm cơ chế retry hoặc Outbox Pattern.

### 5. VNPay HMAC-SHA512

Backend tạo và xác minh chữ ký dữ liệu VNPay bằng HMAC-SHA512 thông qua `vnp_SecureHash`, kết hợp các endpoint Return URL và IPN.

---

## 🚀 Cài đặt và chạy dự án

### 1. Yêu cầu môi trường

| Công cụ | Phiên bản |
|:--|:--|
| Java JDK | 21 LTS |
| Apache Maven | 3.9+ hoặc Maven Wrapper |
| Node.js | Phù hợp với môi trường build |
| npm | Đi kèm Node.js |
| MySQL | 8.4.x hoặc tương thích |
| MongoDB | Community hoặc Atlas |
| Git | Phiên bản phù hợp hệ điều hành |
| IDE | IntelliJ IDEA / Visual Studio Code |

### 2. Clone repository

```bash
git clone https://github.com/thanhhoang8123/QuanLyTiemBanhNgot.git
cd QuanLyTiemBanhNgot
```

### 3. Chuẩn bị Database

Khởi động MySQL và MongoDB local hoặc tạo database development riêng.

Ví dụ các biến kết nối:

```env
DB_URL=jdbc:mysql://localhost:3306/your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

MONGODB_URI=mongodb://localhost:27017/your_database
```

Các giá trị trên chỉ là ví dụ. Cần đối chiếu tên biến và cấu hình thực tế trong Backend trước khi chạy.

### 4. Chạy Backend

Mở Terminal:

```bash
cd backend
```

**Windows PowerShell:**

```powershell
.\mvnw.cmd spring-boot:run
```

**Linux / macOS:**

```bash
./mvnw spring-boot:run
```

Build Backend:

```bash
./mvnw clean package -DskipTests
```

### 5. Chạy Frontend

Mở Terminal mới tại thư mục gốc dự án:

```bash
cd frontend
npm install
```

Tạo file `.env` trong thư mục `frontend`:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Địa chỉ trên là ví dụ; thay bằng URL Backend thực tế.

Khởi chạy:

```bash
npm run dev
```

Build Frontend:

```bash
npm run build
```

### 6. Địa chỉ truy cập local

| Phân hệ | Địa chỉ |
|:--|:--|
| Cửa hàng | `http://localhost:5173/shop` |
| Quản trị | `http://localhost:5173/admin` |
| POS | `http://localhost:5173/pos` |

> **Lưu ý về Flyway và production:** cấu hình production được mô tả trong báo cáo sử dụng Hibernate `ddl-auto=validate`, SQL initialization `never` và tắt Flyway tự động. Schema production phải được chuẩn bị riêng trước khi triển khai. Không tự ý chạy migration hoặc thao tác trên database production khi chưa có kế hoạch an toàn.

---

## 🔑 Tài khoản kiểm thử

Các username dưới đây được báo cáo xác định cho môi trường local/staging:

| Username | Vai trò |
|:--|:--|
| `admin` | ADMIN |
| `manager` | MANAGER |
| `staff01` | STAFF |
| `staff02` | STAFF |
| `customer01` | CUSTOMER |

Mật khẩu do nhóm thiết lập riêng trong môi trường kiểm thử. Không sử dụng tài khoản kiểm thử làm tài khoản production.

---

## 🔌 REST API tiêu biểu

| Method | Endpoint | Chức năng |
|:--:|:--|:--|
| `GET` | `/api/auth/csrf` | Khởi tạo CSRF Token |
| `POST` | `/api/auth/login` | Đăng nhập |
| `POST` | `/api/auth/register` | Đăng ký khách hàng |
| `GET` | `/api/auth/me` | Lấy thông tin tài khoản |
| `POST` | `/api/auth/logout` | Đăng xuất |
| `GET` | `/api/products` | Danh sách sản phẩm |
| `GET` | `/api/categories` | Danh sách danh mục |
| `POST` | `/api/customer/orders` | Tạo đơn hàng trực tuyến |
| `GET` | `/api/customer/orders` | Lịch sử đơn hàng |
| `POST` | `/api/customer/payments/vnpay` | Tạo yêu cầu thanh toán VNPay |
| `GET` | `/api/payments/vnpay/return` | Nhận kết quả Return URL |
| `GET` | `/api/payments/vnpay/ipn` | Nhận thông báo IPN |
| `POST` | `/api/orders` | Tạo đơn hàng POS |
| `POST` | `/api/purchase-orders` | Tạo phiếu nhập hàng |
| `POST` | `/api/purchase-orders/{id}/receive` | Xác nhận nhập kho |
| `GET` | `/api/management/logs/activity` | Tra cứu nhật ký hoạt động |
| `POST` | `/api/shop/contact` | Gửi liên hệ |
| `POST` | `/api/shop/newsletter` | Đăng ký nhận tin |

Đây là các endpoint tiêu biểu được ghi nhận trong báo cáo; không phải toàn bộ API của hệ thống.

---

## 🧪 Kiểm thử và giới hạn hiện tại

### Kết quả kiểm thử được ghi nhận

| Hạng mục | Kết quả theo báo cáo |
|:--|:--|
| Frontend automated tests | **42/42 test đạt** |
| Frontend build | **Thành công** |
| Backend Maven package | **Hoàn tất** |
| Backend `mvn test` | Chưa kết luận Pass/Fail do Mockito không khởi tạo được self-attach agent trên môi trường Windows/Java được dùng để kiểm thử |

### Kiểm tra thủ công trên production

Theo báo cáo ngày 04/11/2026:

- Đăng nhập được các tài khoản customer, admin và manager.
- Khách hàng xem danh mục, tìm kiếm, xem chi tiết sản phẩm và thêm/xóa giỏ hàng.
- Trang checkout mở được nhưng chưa gửi request tạo đơn hàng.
- Manager mở được màn hình POS.
- Manager bị từ chối truy cập tài nguyên quản trị tài khoản.
- Admin tải được dashboard và các trang quản lý ở chế độ đọc.
- Các dữ liệu phiếu nhập PN001–PN003 hiển thị được.

### Các luồng chưa được xác minh đầy đủ

- Chưa thực hiện đầy đủ CRUD production.
- Chưa xác nhận luồng tạo đơn hàng online end-to-end.
- Chưa xác nhận giao dịch VNPay production; tích hợp được mô tả ở môi trường Sandbox.
- Chưa hoàn tất kiểm thử bán hàng thực tế trên POS.
- Chưa xác minh đầy đủ thao tác cập nhật trạng thái đơn bánh riêng.
- Chưa xác minh toàn bộ nghiệp vụ nhập kho và khuyến mãi trên production.
- Chưa có kết quả kiểm thử xâm nhập hoặc benchmark tải hệ thống.

**Lưu ý:** Các mã TC01–TC17 trong báo cáo là danh sách kịch bản nghiệp vụ và kết quả mong đợi, không đồng nghĩa tất cả kịch bản đã được chạy thành công trên production.

---

## ☁️ Triển khai

Dự án được triển khai trên Render.

<div align="center">

[![Live Demo](https://img.shields.io/badge/OPEN-LIVE_DEMO-46A758?style=for-the-badge&logo=render&logoColor=white)](https://quanlytiembanhngot.onrender.com)

**https://quanlytiembanhngot.onrender.com**

</div>

| Thành phần | Nền tảng |
|:--|:--|
| Frontend | Render Static Site |
| Backend | Render Web Service |
| Container | Docker |
| Java Runtime | Java 21 |
| MySQL | Aiven MySQL 8.4.11 |
| MongoDB | MongoDB Atlas |
| Image Storage | Cloudinary |

Frontend gọi Backend thông qua `VITE_API_BASE_URL`. Backend sử dụng profile `prod`, nhận cổng do Render cấp qua biến `PORT` và cấu hình CORS dựa trên `FRONTEND_URL`.

> Website có trạng thái Live không đồng nghĩa tất cả nghiệp vụ đã được nghiệm thu hoặc kiểm thử đầy đủ trên production.

---

## 🔒 Lưu ý bảo mật

- Không commit `.env`, mật khẩu database hoặc thông tin tài khoản thật.
- Không công khai `VNPAY_HASH_SECRET`, Cloudinary API Secret hoặc SMTP Password.
- Không đưa thông tin kết nối production vào tài liệu công khai.
- Chỉ sử dụng dữ liệu giả lập hoặc dữ liệu đã được cho phép trong môi trường kiểm thử.
- Kiểm tra quyền truy cập ở Backend, không chỉ dựa vào giao diện Frontend.

---

## 🛣️ Hướng phát triển

- [ ] Hoàn thiện kiểm thử end-to-end cho quy trình đặt hàng và thanh toán.
- [ ] Hoàn thiện kiểm thử các thao tác CRUD trên các phân hệ quản trị.
- [ ] Tích hợp thêm các phương thức thanh toán như MoMo, Apple Pay và Google Pay.
- [ ] Phát triển ứng dụng di động bằng React Native.
- [ ] Bổ sung thông báo khi đơn bánh được hoàn thành.
- [ ] Xây dựng hệ thống gợi ý sản phẩm dựa trên lịch sử mua hàng.
- [ ] Nâng cấp in hóa đơn POS qua Bluetooth/LAN.
- [ ] Tăng cường giám sát lỗi, retry và độ tin cậy của các tác vụ tích hợp.

---

## 📚 Tài liệu tham khảo

- [GitHub Repository – QuanLyTiemBanhNgot](https://github.com/thanhhoang8123/QuanLyTiemBanhNgot)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/index.html)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/guide/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [VNPay Developer](https://sandbox.vnpayment.vn/apis/)

---

## 👨‍🎓 Thông tin nhóm thực hiện

**Nhóm 04 – Lớp CCQ2411C**  
**Môn học:** Lập trình Java  
**Khoa Công nghệ Thông tin – Trường Cao đẳng Công Thương**  
**Giảng viên hướng dẫn:** Nguyễn Minh Tuấn

<div align="center">

### WA PATISSERIE 🍰
*Sweet Moments, Fresh Every Day.*

**Academic Project · 2026**

</div>
