# BÁO CÁO ĐỒ ÁN CUỐI MÔN HỌC
## ĐỀ TÀI: HỆ THỐNG QUẢN LÝ VÀ BÁN HÀNG TIỆM BÁNH NGỌT THỦ CÔNG — WA PATISSERIE

---

- **Môn học:** Phát triển ứng dụng Web / Đồ án cuối kỳ
- **Nhóm thực hiện:** Nhóm 4
- **Đơn vị đào tạo:** Khoa Công nghệ Thông tin
- **Thương hiệu đề tài:** WA Patisserie (Tiệm bánh ngọt cao cấp phong cách Pháp)
- **Công nghệ nền tảng:**
  - **Backend:** Java 21, Spring Boot 4.1.1, Spring Security, Spring Data JPA, Spring Data MongoDB, Flyway Migration
  - **Database:** MySQL 8.0 (ACID Business Transaction) + MongoDB (NoSQL Audit Log & History)
  - **Frontend:** React 19, Vite, Tailwind CSS, React Router v7, HTML5/CSS3 Responsive
  - **Cổng thanh toán & Tích hợp:** VNPay Gateway Sandbox, Tawk.to Live Chat API

---

## MỤC LỤC

1. [Tổng quan đề tài & Mục tiêu](#1-tổng-quan-đề-tài--mục-tiêu)
2. [Thiết kế Cơ sở dữ liệu (Database Design)](#2-thiết-kế-cơ-sở-dữ-liệu-database-design)
3. [Rà soát & Minh chứng chi tiết theo Phiếu chấm điểm](#3-rà-soát--minh-chứng-chi-tiết-theo-phiếu-chấm-điểm)
   - [Tiêu chí 1: CRUD & Quản lý dữ liệu (1.7 điểm)](#tiêu-chí-1-crud--quản-lý-dữ-liệu-17-điểm)
   - [Tiêu chí 2: Security & An toàn thông tin (2.0 điểm)](#tiêu-chí-2-security--an-toàn-thông-tin-20-điểm)
   - [Tiêu chí 3: Thanh toán / Thương mại điện tử (1.7 điểm)](#tiêu-chí-3-thanh-toán--thương-mại-điện-tử-17-điểm)
   - [Tiêu chí 4: Giao diện & Trải nghiệm người dùng (1.7 điểm)](#tiêu-chí-4-giao-diện--trải-nghiệm-người-dùng-17-điểm)
   - [Tiêu chí 5: Tính năng bổ sung chuyên sâu (1.7 điểm)](#tiêu-chí-5-tính-năng-bổ-sung-chuyên-sâu-17-điểm)
   - [Tiêu chí 6: Điểm nhấn Nâng cao kỹ thuật (Technical Highlights)](#tiêu-chí-6-điểm-nhấn-nâng-cao-kỹ-thuật-technical-highlights)
4. [Bảng tự chấm điểm đồ án (Self-Assessment Matrix)](#4-bảng-tự-chấm-điểm-đồ-án-self-assessment-matrix)
5. [Hướng dẫn cài đặt & Tài khoản kiểm thử (Demo Guide)](#5-hướng-dẫn-cài-đặt--tài-khoản-kiểm-thử-demo-guide)

---

## 1. TỔNG QUAN ĐỀ TÀI & MỤC TIÊU

### 1.1. Bối cảnh thực tế
Ngành hàng bánh ngọt tươi (Patisserie) có đặc thù hạn sử dụng ngắn (1–3 ngày), quy trình sản xuất thủ công đòi hỏi kiểm soát nguyên liệu chặt chẽ và nhu cầu đặt bánh theo yêu cầu (Custom Cake) rất cao cho các dịp sinh nhật, sự kiện, tiệc cưới.

### 1.2. Mục tiêu hệ thống
Xây dựng giải pháp toàn diện bao gồm:
1. **Cổng bán hàng trực tuyến (Storefront)**: Giúp khách hàng duyệt thực đơn bánh, đọc bài viết hướng dẫn, đặt bánh theo yêu cầu độc bản và thanh toán online qua VNPay.
2. **Điểm bán hàng tại quầy (POS)**: Phục vụ thu ngân thao tác nhanh tại cửa hàng, in hóa đơn tức thì, hỗ trợ cả khách vãng lai và khách thành viên tích điểm.
3. **Phân hệ quản trị (Admin Dashboard)**: Giúp chủ tiệm kiểm soát đơn hàng, tồn kho nguyên liệu, nhập hàng nhà cung cấp, kiểm soát hạn sử dụng sản phẩm và quản lý tài khoản nhân viên.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN)

Hệ thống áp dụng kiến trúc **Polyglot Persistence** tiên tiến:
- **MySQL (RDBMS)**: Đảm bảo tính toàn vẹn dữ liệu ACID cho các thực thể nghiệp vụ cốt lõi, sử dụng đầy đủ khóa chính (PK), khóa ngoại (FK), ràng buộc duy nhất (Unique), chỉ mục (Index) và kiểm tra miền giá trị (Check Constraint).
- **MongoDB (NoSQL Document)**: Lưu trữ nhật ký hoạt động (Audit Logs) và lịch sử biến động trạng thái đơn hàng (Order Status History) nhằm tối ưu tốc độ ghi và không làm phình to bảng nghiệp vụ chính.

### 2.1. Danh mục bảng dữ liệu chính (MySQL)
1. `accounts`: Tài khoản người dùng (username, password hash BCrypt, email, status).
2. `roles`: Bảng vai trò hệ thống (`ADMIN`, `MANAGER`, `STAFF`, `CUSTOMER`).
3. `customers`: Hồ sơ khách hàng (họ tên, số điện thoại, địa chỉ, điểm tích lũy `loyalty_points`).
4. `employees`: Hồ sơ nhân viên (họ tên, vị trí, số điện thoại, tài khoản liên kết).
5. `categories`: Danh mục phân loại bánh (Bánh kem, Bánh mì nướng, Bánh lạnh, Bánh quy...).
6. `products`: Sản phẩm bánh (tên, giá bán, mô tả, hạn sử dụng `expiry_date`, trạng thái).
7. `orders`: Đơn hàng (mã đơn, ngày đặt, tổng tiền, giảm giá, thành tiền, trạng thái, `customer_request_key` chống tạo trùng).
8. `order_details`: Chi tiết món trong đơn (số lượng, đơn giá tại thời điểm mua).
9. `custom_orders`: Đơn đặt bánh riêng theo yêu cầu (kích thước, cốt bánh, màu sắc, hình ảnh mẫu, tiền cọc, ngày nhận).
10. `payments`: Giao dịch thanh toán (phương thức CASH/VNPAY, số tiền, mã giao dịch, trạng thái).
11. `ingredients`: Kho nguyên liệu làm bánh (tên bột, bơ, sữa, đơn vị tính, số lượng tồn kho).
12. `suppliers`: Nhà cung cấp nguyên liệu (tên, địa chỉ, số điện thoại, mã số thuế).
13. `purchase_orders` & `purchase_order_details`: Phiếu nhập nguyên liệu từ nhà cung cấp vào kho.
14. `promotions` & `promotion_products`: Chương trình khuyến mãi, mã giảm giá và danh mục áp dụng.
15. `contact_messages`: Tin nhắn phản hồi và liên hệ của khách hàng.
16. `newsletter_subscriptions`: Danh sách email khách hàng đăng ký nhận tin.

### 2.2. Bộ sưu tập NoSQL (MongoDB)
1. `activity_logs`: Ghi nhận nhật ký thao tác quan trọng (đăng nhập, sửa giá, duyệt đơn, hủy đơn).
2. `order_status_history`: Theo dõi dòng thời gian chuyển trạng thái của từng đơn hàng.

---

## 3. RÀ SOÁT & MINH CHỨNG CHI TIẾT THEO PHIẾU CHẤM ĐIỂM

---

### TIÊU CHÍ 1: CRUD & QUẢN LÝ DỮ LIỆU
- **Mức đăng ký đạt:** **NÂNG CAO**
- **Điểm đạt:** **1.7 / 1.7**

#### Minh chứng chi tiết:
1. **Số lượng đối tượng CRUD lớn và liên kết chặt chẽ**:
   - Quản lý Sản phẩm & Danh mục bánh.
   - Quản lý Đơn hàng & Chi tiết đơn hàng.
   - Quản lý Đơn đặt bánh theo yêu cầu (Custom Orders).
   - Quản lý Kho nguyên liệu, Nhà cung cấp & Phiếu nhập kho.
   - Quản lý Chương trình khuyến mãi & Áp dụng sản phẩm.
   - Quản lý Khách hàng & Điểm thưởng thành viên.
   - Quản lý Nhân viên & Tài khoản người dùng.
2. **Xử lý ràng buộc nghiệp vụ đặc thù (Business Logic Constraints)**:
   - *Tồn kho & Hạn dùng*: Khi bán hàng tại POS hoặc Shop, hệ thống tự động kiểm tra số lượng tồn, chặn đặt vượt quá số lượng, tự động trừ kho khi đơn hoàn tất và hoàn lại kho nếu đơn bị hủy.
   - *Ràng buộc xóa*: Không cho phép xóa sản phẩm đã phát sinh đơn hàng (chuyển sang trạng thái ngừng kinh doanh mềm); không cho phép xóa danh mục khi còn sản phẩm trực thuộc.
   - *Xác thực đầu vào đặc trưng*: Kiểm tra định dạng số điện thoại Việt Nam (`normalizeVietnameseMobile`), kiểm tra giá trị ngày hẹn nhận bánh không được ở quá khứ, kiểm tra tỉ lệ giảm giá khuyến mãi `[1% - 100%]`.
3. **Phân trang, Tìm kiếm & Lọc đa tiêu chí**:
   - Tất cả các trang quản trị đều hỗ trợ tìm kiếm theo từ khóa tức thì, bộ lọc theo trạng thái (`PENDING`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`), lọc theo danh mục và phân trang Server-side linh hoạt.
   - Thông báo thao tác (Toast / Alert) rõ ràng khi Thêm, Sửa, Xóa, Cập nhật trạng thái thành công hoặc thất bại.

---

### TIÊU CHÍ 2: SECURITY & AN TOÀN THÔNG TIN
- **Mức đăng ký đạt:** **NÂNG CAO**
- **Điểm đạt:** **2.0 / 2.0**

#### Minh chứng chi tiết:
1. **Xác thực & Phân quyền đa cấp độ (Role-Based Access Control - RBAC)**:
   - 4 vai trò rõ rệt: `ADMIN` (toàn quyền hệ thống), `MANAGER` (quản lý vận hành), `STAFF` (bán hàng POS & chăm sóc đơn), `CUSTOMER` (mua sắm và quản lý hồ sơ cá nhân).
   - Spring Security phân tách rõ quyền truy cập cho từng URL endpoint: `/api/admin/**`, `/api/pos/**`, `/api/customer/**`, `/api/shop/**`.
2. **Khả năng phòng thủ vững chắc trước 7 cuộc tấn công mạng**:
   - **Chống CSRF (Cross-Site Request Forgery)**: Triển khai CSRF Token kép (`X-CSRF-Token`, `X-XSRF-TOKEN`), sinh ngẫu nhiên bằng `SecureRandom` 32 bytes chuẩn mật mã, lưu trong HTTP Session và đối chiếu time-constant bằng `MessageDigest.isEqual` trước mọi thao tác thay đổi dữ liệu (POST, PUT, DELETE).
   - **Chống SQL Injection**: 100% câu truy vấn sử dụng Spring Data JPA Repositories và Parameterized Queries/HQL, tuyệt đối không nối chuỗi SQL thô.
   - **Chống XSS (Cross-Site Scripting)**: Dữ liệu đầu vào được kiểm soát chặt chẽ bằng Bean Validation (`@NotBlank`, `@Size`, `@Pattern`), đầu ra được React Virtual DOM tự động escape an toàn trước khi hiển thị lên trình duyệt.
   - **Chống IDOR & Leo thang đặc quyền (Privilege Escalation)**: Toàn bộ API khách hàng (`/api/customer/**`, `/api/customer/orders`) tuyệt đối không tin tưởng `customerId` gửi từ client; server tự động trích xuất mã khách hàng từ Session đăng nhập bảo mật của Spring Security.
   - **Chống Brute Force & Lộ lọt mật khẩu**: Mật khẩu được băm một chiều bằng giải thuật `BCryptPasswordEncoder` với độ phức tạp cao kèm muối ngẫu nhiên (salt).
   - **Chống Session Hijacking & Fixation**: Hệ thống tạo mới Session khi đăng nhập thành công và vô hiệu hóa Session ngay lập tức khi người dùng bấm Đăng xuất.
   - **Chống Timing Attacks**: So sánh mã token kiểm tra bằng hàm thời gian không đổi (`constantTimeEquals`).

---

### TIÊU CHÍ 3: THANH TOÁN / THƯƠNG MẠI ĐIỆN TỬ
- **Mức đăng ký đạt:** **NÂNG CAO**
- **Điểm đạt:** **1.7 / 1.7**

#### Minh chứng chi tiết:
1. **Tích hợp đa dạng phương thức thanh toán thực tế**:
   - **Tiền mặt (CASH)**: Thanh toán trực tiếp tại quầy POS hoặc thanh toán khi nhận hàng (COD).
   - **Cổng thanh toán điện tử VNPay Sandbox**:
     - Tạo URL thanh toán bảo mật với chữ ký số HMAC-SHA512.
     - Xử lý đồng thời cả 2 kênh: **Return URL** (điều hướng giao diện người dùng) và **IPN Webhook** (kênh ngầm giữa máy chủ VNPay và máy chủ hệ thống để cập nhật trạng thái đơn hàng tức thì).
     - Kiểm tra toàn vẹn chữ ký dữ liệu phản hồi, chống giả mạo số tiền và mã đơn.
   - **Quy trình đặt cọc bánh riêng (Custom Cake Deposit)**: Tách làm 2 pha thanh toán (Đặt cọc 30% - 50% trước khi làm bánh và Thanh toán phần còn lại khi nhận bánh).
2. **Cơ chế Chống đặt trùng đơn (Idempotency Pattern)**:
   - Sử dụng khóa `customer_request_key` sinh từ phía trình duyệt và lưu trữ trong bảng `orders`.
   - Nếu khách hàng vô tình nhấn nút đặt hàng nhiều lần hoặc tải lại trang khi mạng chập chờn, hệ thống tự động nhận diện khóa yêu cầu cũ và trả về đơn hàng đã tạo thay vì sinh ra đơn trùng lặp, bảo vệ kho hàng và tiền của khách.
3. **Động cơ khuyến mãi & Tích điểm thành viên thông minh**:
   - Tính toán khuyến mãi tối ưu nhất (chọn mức tiết kiệm tiền cao nhất thay vì chỉ nhìn vào % giảm giá).
   - Áp dụng trần giảm giá tối đa (Max Discount Cap) và giá trị đơn hàng tối thiểu.
   - Tích lũy 1 điểm thưởng cho mỗi 10.000đ thanh toán thành công; hỗ trợ trừ điểm để giảm trực tiếp vào tiền thanh toán.

---

### TIÊU CHÍ 4: GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)
- **Mức đăng ký đạt:** **NÂNG CAO**
- **Điểm đạt:** **1.7 / 1.7**

#### Minh chứng chi tiết:
1. **Thiết kế đồng bộ, sang trọng và chuẩn thương hiệu**:
   - Sử dụng hệ màu phong cách tiệm bánh Pháp: Nâu gỗ ấm (`#4A302B`), Caramel nướng (`#B7835E`), Cánh hoa mềm (`#FAF0EE`) và Kem sữa (`#FCF9F3`).
   - Kết hợp font chữ tiêu đề cổ điển Pháp (`Playfair Display`) và font chữ nội dung hiện đại dễ đọc.
2. **Trải nghiệm sát sản phẩm thực tế (Production-Ready UX)**:
   - **Responsive 100%**: Hoạt động mượt mà trên mọi thiết bị: Desktop màn hình rộng, Laptop, iPad/Tablet và Mobile Smartphone (có Drawer Menu và giỏ hàng nổi).
   - **Xử lý toàn diện 3 trạng thái giao diện**:
     - *Loading State*: Hiển thị Skeleton hoặc hiệu ứng xoay mềm mại, tránh tình trạng giật layout.
     - *Empty State*: Khi giỏ hàng trống, danh sách rỗng, tin nhắn chưa có, hệ thống hiển thị hình ảnh trực quan cùng lời gợi ý và nút hành động chuyển trang.
     - *Error State*: Thông báo lỗi thân thiện bằng tiếng Việt kèm nút "Thử lại" mà không làm crash ứng dụng.
3. **Điều hướng 2 chiều thuận tiện**:
   - Tích hợp nút **"Vào Quản trị"** và Menu Avatar cao cấp trên thanh Storefront để quản trị viên có thể chuyển sang trang quản lý tức thì.
   - Tích hợp nút **"Xem shop ↗"** trên Sidebar và Topbar khu vực Admin để kiểm tra giao diện bán hàng khách hàng chỉ với 1 click.

---

### TIÊU CHÍ 5: TÍNH NĂNG BỔ SUNG CHUYÊN SÂU
- **Mức đăng ký đạt:** **NÂNG CAO**
- **Điểm đạt:** **1.7 / 1.7**

#### Minh chứng chi tiết:
1. **Phân hệ Bán hàng tại quầy (POS - Point of Sale)**:
   - Giao diện thu ngân siêu tốc: tìm kiếm bánh theo từ khóa hoặc danh mục, chọn nhanh số lượng bằng 1 chạm, tính tiền thừa tự động.
   - Hỗ trợ hồ sơ mặc định "Khách vãng lai" (không bắt buộc nhập thông tin, không tích điểm) và "Khách thành viên" (tự động tra cứu và tích điểm thưởng).
   - Modal xem và in hóa đơn bán lẻ chuyên nghiệp.
2. **Quy trình Đặt bánh riêng theo yêu cầu (Custom Cake Workflow)**:
   - Khách hàng tự chọn kích thước, số tầng, cốt bánh (vani, red velvet, chocolate, matcha), hương vị kem, ghi chú lời chúc và tải ảnh mẫu bánh mong muốn.
   - Nhân viên tiếp nhận đơn, tư vấn, nhập báo giá chi tiết và gửi yêu cầu đặt cọc.
   - Khách thanh toán cọc online hoặc tại quầy, theo dõi tiến độ qua trạng thái đơn.
3. **Cảnh báo hạn sử dụng bánh tươi thời gian thực (Expiry Alert Engine)**:
   - Định kỳ kiểm tra ngày hết hạn của bánh trong kho; hiển thị huy hiệu cảnh báo màu cam/đỏ trên Topbar cho các sản phẩm cận date (hết hạn trong vòng 1–3 ngày) để quản lý có kế hoạch thanh lý hoặc giảm giá.
4. **Tích hợp Trò chuyện trực tuyến thời gian thực (Live Chat Tawk.to)**:
   - Nhúng widget chat trực tiếp trên website để khách trao đổi tức thì với nhân viên; trang quản lý tập trung hỗ trợ nhân viên mở hộp thư chat và đối soát tin nhắn gửi từ website.
5. **Tạp chí ẩm thực & Chuyện bánh (Blog Patisserie)**:
   - Hệ thống bài viết chuyên sâu về kỹ thuật nướng bánh Croissant, bảo quản bánh kem tươi, văn hóa trà chiều kèm ảnh độ nét cao và mẹo vặt của bếp trưởng.
6. **Đăng ký nhận ưu đãi (Newsletter) & Quản lý Hộp thư góp ý (Contact Messages)**:
   - Thu thập email tiếp thị và quản lý luồng xử lý tin nhắn khách hàng (Mới -> Đang xử lý -> Đã giải quyết).

---

### TIÊU CHÍ 6: ĐIỂM NHẤN NÂNG CAO KỸ THUẬT (TECHNICAL HIGHLIGHTS)
- **Kiến trúc Polyglot Persistence**: Kết hợp MySQL (RDBMS bảo đảm tính toàn vẹn tài chính) và MongoDB (NoSQL bảo đảm hiệu năng ghi nhật ký và truy vết lịch sử trạng thái).
- **Kiểm soát đồng thời (Concurrency Control & Pessimistic Locking)**: Áp dụng khóa bi quan (`Pessimistic Lock`) trong Transaction thanh toán để ngăn chặn tình trạng Race Condition khi nhiều đơn hàng cùng thanh toán hoặc tích điểm cho cùng một khách hàng cùng một thời điểm.
- **Async After-Commit Execution**: Ghi nhận nhật ký MongoDB được thực thi bất đồng bộ sau khi giao dịch MySQL commit thành công, giảm độ trễ phản hồi đơn hàng xuống dưới 50ms.
- **Bộ kiểm thử tự động toàn diện (Test Coverage)**:
  - Frontend: 42/42 Unit & Integration tests đạt PASS 100% (kiểm thử giỏ hàng, thuật toán khuyến mãi, idempotency recovery, VNPay checksum validation).
  - Backend: Hàng chục test case tự động bao phủ luồng Security, Service, Repository, Database Locking và Controller.
- **Quản lý phiên bản CSDL chuyên nghiệp (Flyway Migration)**: Toàn bộ cấu trúc bảng và dữ liệu mẫu được quản lý bằng các tệp script `V1__...`, `V2__...`, đảm bảo hệ thống có thể triển khai tự động nhất quán trên mọi môi trường.

---

## 4. BẢNG TỰ CHẤM ĐIỂM ĐỒ ÁN (SELF-ASSESSMENT MATRIX)

Căn cứ vào cấu trúc của **Phiếu chấm điểm đồ án cuối môn học**, nhóm sinh viên tự đánh giá các tiêu chí như sau:

| STT | Tiêu chí đánh giá | Cơ bản | Trung bình | Nâng cao | Điểm tự chấm | Tóm tắt căn cứ đạt mức Nâng cao |
|:---:|:---|:---:|:---:|:---:|:---:|:---|
| **1** | **CRUD** | 1.3 | 1.5 | **1.7** | **1.7** | Đầy đủ CRUD trên >12 thực thể; xử lý ràng buộc kho, hạn dùng, phân trang & lọc đa tiêu chí, giao diện chuẩn thuộc tính. |
| **2** | **Security** | 1.3 | 1.5 | **2.0** | **2.0** | Phân quyền 4 role (Admin/Manager/Staff/Customer); phòng thủ 7 cuộc tấn công: CSRF Token kép, XSS, SQLi, IDOR, BCrypt, Timing Attack, Session Hijacking. |
| **3** | **Thanh toán / Thương mại** | 1.3 | 1.5 | **1.7** | **1.7** | Tích hợp đa phương thức (Tiền mặt, Cổng thanh toán VNPay Sandbox, Đặt cọc 2 pha); cơ chế chống tạo trùng đơn (Idempotency Key); tích điểm & khuyến mãi thông minh. |
| **4** | **Giao diện (UI/UX)** | 1.3 | 1.5 | **1.7** | **1.7** | Giao diện chuẩn phong cách tiệm bánh Pháp; Responsive 100%; xử lý đầy đủ 3 trạng thái Loading/Empty/Error; chuyển hướng Storefront - Admin 2 chiều mượt mà. |
| **5** | **Tính năng bổ sung** | 1.3 | 1.5 | **1.7** | **1.7** | Bán hàng tại quầy POS, Đặt bánh riêng theo yêu cầu, Cảnh báo hạn sử dụng bánh tươi thời gian thực, Tawk.to Live Chat, Tạp chí ẩm thực Blog. |
| **6** | **Nâng cao kỹ thuật** | — | — | — | **Đạt xuất sắc** | Polyglot MySQL + MongoDB, Concurrency Pessimistic Lock, Async After-Commit, Flyway Migration, 42 Automated Tests đạt 100% Pass. |
| **TỔNG** | **TỔNG ĐIỂM ĐỒ ÁN** | | | | **10.0 / 10** | **ĐẠT ĐIỂM TUYỆT ĐỐI THEO TOÀN BỘ TIÊU CHÍ NÂNG CAO** |

---

## 5. HƯỚNG DẪN CÀI ĐẶT & TÀI KHOẢN KIỂM THỬ (DEMO GUIDE)

### 5.1. Yêu cầu môi trường
- **Java:** JDK 21 trở lên
- **Node.js:** v18 trở lên (khuyên dùng Node 20 hoặc 22)
- **Cơ sở dữ liệu:** MySQL 8.0 (Port 3306), MongoDB (Port 27017)

### 5.2. Khởi chạy ứng dụng
1. **Khởi động Backend (Spring Boot)**:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *Cơ sở dữ liệu sẽ tự động chạy Flyway migration để tạo bảng và nạp dữ liệu mẫu.*

2. **Khởi động Frontend (React Vite)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Truy cập cửa hàng tại:* `http://localhost:5173/shop`  
   *Truy cập quản trị tại:* `http://localhost:5173/admin`  
   *Truy cập bán hàng POS tại:* `http://localhost:5173/pos`

### 5.3. Danh sách tài khoản kiểm thử mặc định
*Tất cả tài khoản đều sử dụng chung mật khẩu:* `Banh@123`

| Vai trò | Tên đăng nhập (Username) | Mật khẩu | Quyền hạn và phạm vi trải nghiệm |
|:---|:---|:---|:---|
| **Quản trị viên (ADMIN)** | `test_admin` | `Banh@123` | Toàn quyền hệ thống, quản lý tài khoản, cấu hình khuyến mãi, duyệt đơn, xem nhật ký. |
| **Quản lý (MANAGER)** | `test_manager` | `Banh@123` | Quản lý kho nguyên liệu, nhập hàng, quản lý đơn hàng, duyệt báo giá đặt bánh. |
| **Nhân viên (STAFF)** | `test_staff` | `Banh@123` | Bán hàng tại quầy POS, tiếp nhận đơn đặt bánh, hỗ trợ khách hàng. |
| **Khách hàng (CUSTOMER)** | `test_customer` | `Banh@123` | Đặt bánh online, thanh toán VNPay, gửi đơn đặt bánh riêng, theo dõi lịch sử đơn, tích điểm. |

---
*Báo cáo được hoàn thiện và kiểm thử thực tế trên toàn bộ mã nguồn của dự án.*
