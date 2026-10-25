# Báo cáo tiến độ dự án QuanLyTiemBanhNgot

## 1) Đã hoàn thành

- Bổ sung luồng customer order an toàn: xác định khách hàng từ session phía server, không tin vào customerId từ client.
- Thêm cơ chế idempotency cho checkout: lưu `customer_request_key`, tránh tạo đơn trùng khi reload/retry.
- Thêm API tra cứu đơn theo idempotency key chỉ đọc, không tạo đơn và không ảnh hưởng kho hàng.
- Cập nhật frontend recovery: pending checkout lưu trong `sessionStorage`, khôi phục key + payload cũ sau reload.
- Cập nhật quyền truy cập: CUSTOMER chỉ xem đơn của chính mình; không lộ đơn của khách khác.
- Sửa logic người lập/tiếp nhận đơn: tự hiển thị tên nhân viên gắn với tài khoản đang đăng nhập, không cho chọn người khác; nếu không có hồ sơ nhân viên đang hoạt động thì chặn thao tác.
- Phiếu nhập hàng cũng tự hiển thị tên người lập; backend xác nhận employeeId thuộc tài khoản đang đăng nhập.
- POS có hồ sơ dùng chung “Khách vãng lai”, không yêu cầu nhập thông tin và không tích điểm.
- Khách có hồ sơ riêng được cộng 1 điểm cho mỗi 10.000đ thanh toán thành công; điểm được khóa/cập nhật trong cùng transaction thanh toán để tránh mất điểm khi nhiều đơn cùng thanh toán.
- Bổ sung hồ sơ nhân viên cho tài khoản test admin/quản lý để hiển thị đúng tên người đang đăng nhập.
- Thêm màn hình/log đọc-only cho quản lý/admin; bảo vệ luồng trạng thái đơn và read-only audit.
- Cập nhật tài khoản test local và password mặc định để dễ khởi chạy ở môi trường dev.

## 2) File quan trọng đã sửa

- Backend
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/controller/CustomerOrderController.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/service/CustomerOrderService.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/service/OrderService.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/repository/OrderRepository.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/config/SecurityConfig.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/controller/EmployeeController.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/service/EmployeeService.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/controller/PurchaseOrderController.java`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/service/PurchaseOrderService.java`
  - `backend/src/main/resources/db/migration/V20261024_1__customer_order_idempotency.sql`
  - `backend/src/main/resources/db/migration/V20261025_2__seed_pos_walk_in_customer.sql`
  - `backend/src/main/resources/db/dev-migration/V20261025_3__link_test_employee_accounts.sql`
  - `backend/src/main/java/com/nhom4/QuanLyTiemBanhNgot/service/PaymentService.java`

- Frontend
  - `frontend/src/features/shop/services/customerOrderAttempt.js`
  - `frontend/src/features/shop/services/customerOrderAttempt.test.js`
  - `frontend/src/features/shop/pages/ShopCheckoutPage.jsx`
  - `frontend/src/features/pos/pages/PosPage.jsx`
  - `frontend/src/features/orders/pages/OrdersPage.jsx`
  - `frontend/src/features/custom-orders/pages/CustomOrdersPage.jsx`
  - `frontend/src/features/purchase-orders/pages/PurchaseOrdersPage.jsx`
  - `frontend/src/features/pos/pages/PosPage.jsx`

## 3) Kết quả kiểm thử

- Backend tests liên quan: PASS
- Frontend tests liên quan: PASS
- Build production: PASS

Chi tiết:
- `customer_order` recovery/idempotency tests: 7/7
- `backend` customer order tests: 7/7
- `npm run build`: thành công

## 4) Vấn đề đã xử lý

- Port 8080 đang bị chiếm bởi tiến trình Java cũ => backend khởi động lỗi. Đây là lỗi môi trường, không phải lỗi code.
- Khi người dùng chọn nhân viên, ứng dụng trước đó cho phép chọn bất kỳ nhân viên đang hoạt động nào; đã sửa để dùng nhân viên của tài khoản đang đăng nhập thay vì toàn bộ danh sách nhân viên.
- Form tạo đơn thường, POS và đơn đặt bánh hiện hiển thị tên hồ sơ của tài khoản đang đăng nhập. Admin/quản lý cũng cần được liên kết với hồ sơ nhân viên đang hoạt động để tên xuất hiện; nếu chưa liên kết, giao diện báo rõ và không cho tạo đơn.
- Đã chuyển ô người lập đơn ở POS/đơn thường, người tiếp nhận khi tạo đơn đặt bánh và người lập phiếu nhập thành ô chỉ đọc, không còn yêu cầu người dùng chọn lại tên mình.

## 5) Còn lại / cần test thủ công thêm

- Kiểm tra browser E2E thật với tài khoản dev trên môi trường đang chạy duy nhất một backend.
- Kiểm tra luồng checkout người dùng: chọn sản phẩm -> giỏ hàng -> checkout -> reload -> không tạo đơn thứ hai.
- Kiểm tra login với tài khoản dev và quyền từng role.
- Kiểm tra trạng thái đơn sau thanh toán và delivery khi dùng flow thật.
- Kiểm tra các màn hình POS/manager nếu tài khoản chưa gắn employee sẽ bị chặn rõ ràng.
- Kiểm tra đăng nhập bằng tài khoản admin/quản lý để xác nhận hồ sơ employee đã liên kết đúng tên.

## Cập nhật hiển thị người đang đăng nhập

- Đã áp dụng tên tài khoản hiện tại cho POS, đơn hàng, đơn đặt bánh và phiếu nhập hàng.
- Backend tạo phiếu nhập cũng từ chối employeeId khác với nhân viên gắn tài khoản hiện tại.
- Xác thực phần cập nhật này: backend compile PASS; frontend production build PASS. Chưa chạy test tự động riêng cho phiếu nhập.

## Cập nhật POS, khách vãng lai và điểm

- Khách vãng lai được seed bằng Flyway thành hồ sơ dùng chung và được đưa lên đầu danh sách khách trong POS.
- Điểm chỉ cộng khi Payment chuyển sang `SUCCESS`; mức cộng là 1 điểm mỗi 10.000đ đã thanh toán, lấy phần nguyên. Khách vãng lai và thanh toán thất bại không được cộng.
- Đã thêm test đơn vị cho cộng điểm, khách vãng lai, thanh toán thất bại và chống cộng lại khi xử lý payment đã thành công.

## 6) Ghi chú môi trường

- Hãy đảm bảo chỉ chạy một instance Spring Boot trên port 8080. Nếu port đang bị chiếm, cần dừng tiến trình Java cũ hoặc đổi port.
- Mật khẩu test chuẩn cho dev: `Banh@123`.
- Tài khoản local dev nên được dùng trong môi trường local, không dùng như môi trường production.
