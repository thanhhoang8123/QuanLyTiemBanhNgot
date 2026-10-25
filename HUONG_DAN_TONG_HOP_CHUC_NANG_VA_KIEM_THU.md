# Chức năng đã triển khai và cách kiểm thử

## Đã triển khai

- Đăng nhập theo phiên, mã hóa mật khẩu BCrypt, phân quyền theo vai trò và bảo vệ request thay đổi dữ liệu bằng CSRF.
- Đăng ký khách hàng và xác minh email; quản trị viên có giao diện quản lý tài khoản.
- POS tạo đơn có kiểm tra tồn kho; hủy đơn chờ xử lý hoàn tồn một lần. Nhận phiếu nhập cập nhật tồn nguyên liệu an toàn.
- POS hỗ trợ khách vãng lai bằng hồ sơ dùng chung, không lưu thông tin cá nhân và không tích điểm. Khách có hồ sơ riêng được cộng 1 điểm cho mỗi 10.000đ thanh toán thành công; đơn thất bại không cộng điểm.
- Thanh toán mô phỏng `SUCCESS`/`FAILED`; kiểm soát điều kiện giao hàng, hoàn tất đơn và xử lý thao tác lặp.
- Gửi email xác minh và email tiếp nhận đơn sau khi transaction thành công.
- Trang shop hỗ trợ xem sản phẩm, giỏ hàng, checkout, tạo đơn và xem lịch sử/chi tiết đơn của khách đã xác thực.
- Checkout dùng idempotency key theo từng khách; khi khôi phục yêu cầu đang chờ, giao diện tra cứu đơn trước và chỉ retry cùng key/payload nếu API xác nhận chưa có đơn. Chưa tích hợp thanh toán trực tuyến.
- Quản lý (ADMIN/MANAGER) có thể xem 100 bản ghi gần nhất của hai collection MongoDB `activity_logs` và `order_status_histories`; chỉ đọc, không sửa/xóa để giữ toàn vẹn kiểm toán.

## Tích hợp

- MySQL lưu dữ liệu nghiệp vụ; Flyway chạy migration và tạo dữ liệu test trong profile `dev`.
- MongoDB lưu nhật ký hoạt động và lịch sử trạng thái đơn.
- Cloudinary upload ảnh sản phẩm; kiểm tra định dạng JPG/PNG/WEBP và giới hạn 5 MB.
- SMTP gửi email. Cloudinary, MongoDB và SMTP cần cấu hình biến môi trường tương ứng khi kiểm thử tích hợp thật.
- Cấu hình `prod` yêu cầu thông tin dịch vụ qua biến môi trường; không lưu credential trong Git.

## Tài khoản kiểm thử local

Profile `dev` có seed tạo bốn tài khoản kiểm thử, mỗi tài khoản tương ứng một vai trò:

| Username | Vai trò |
| --- | --- |
| `test_admin` | ADMIN |
| `test_manager` | MANAGER |
| `test_staff` | STAFF |
| `test_customer` | CUSTOMER |

Seed nằm tại `backend/src/main/resources/db/dev-migration/` và chỉ được nạp khi chạy profile `dev`. Tài khoản có trạng thái hoạt động và email xác minh; khách kiểm thử được liên kết hồ sơ Customer, tài khoản ADMIN/MANAGER/STAFF kiểm thử được liên kết hồ sơ Employee.

**Mật khẩu dùng chung cho cả bốn tài khoản local: `Banh@123`.** Migration `V20261025_1` đặt lại mật khẩu cho các tài khoản test hiện có; migration `V20261025_3` bổ sung hồ sơ nhân viên cho tài khoản test ADMIN/MANAGER. Trên database local, khởi động backend bằng profile `dev` để Flyway áp dụng migration. Database mới cũng nhận dữ liệu sau khi chạy đủ seed và dev migration.

Các tài khoản và mật khẩu này chỉ dành cho môi trường local/test. Không dùng chúng trên môi trường dùng chung hoặc production; không đưa migration dev vào Flyway locations của production.

## Cách kiểm thử

### Chạy tự động

```powershell
Set-Location D:\QuanLyTiemBanhNgot\backend
.\mvnw.cmd test

Set-Location D:\QuanLyTiemBanhNgot\frontend
npm run build
```

Test email hiện có dùng mock, không gửi email thật. Build frontend kiểm tra biên dịch giao diện.

### Kiểm thử luồng trên local

1. Chạy MySQL với database local đã có schema nền; khởi động backend bằng `.\mvnw.cmd spring-boot:run` trong thư mục `backend`.
2. Chạy `npm run dev` trong thư mục `frontend`, mở địa chỉ Vite được hiển thị. Chỉ dùng tài khoản và dữ liệu test trên local.
3. Đăng nhập lần lượt theo vai trò; kiểm tra điều hướng, quyền truy cập, tải lại trang và đăng xuất.
4. Đăng ký khách hàng bằng email test, xác minh email rồi đăng nhập; tài khoản chưa xác minh phải bị từ chối.
5. Ở shop, thêm sản phẩm vào giỏ và đặt đơn bằng tài khoản CUSTOMER đã xác minh. Thử tải lại checkout sau khi yêu cầu chưa rõ kết quả; xác nhận tra cứu bằng key cũ, không phát sinh đơn mới khi lookup lỗi và chỉ retry cùng key khi API trả 404.
6. Trên POS, chọn `Khách vãng lai` hoặc hồ sơ khách hàng có sẵn và sản phẩm còn hàng; tên nhân viên được lấy theo tài khoản đang đăng nhập. Tạo đơn sẽ giảm tồn kho. Thanh toán mô phỏng `SUCCESS` cộng 1 điểm mỗi 10.000đ cho khách có hồ sơ; khách vãng lai không tích điểm. Sau đó giao (nếu có địa chỉ) rồi hoàn tất. Không thể đổi trạng thái tùy ý hoặc giao/hoàn tất khi chưa thanh toán thành công.
7. Dùng `/admin/logs` để xem hai collection NoSQL; trang chỉ đọc, không cho sửa/xóa log.
8. Tạo và nhận phiếu nhập; xác nhận tồn nguyên liệu chỉ tăng một lần. Thử quyền quản lý tài khoản bằng tài khoản không phải ADMIN.
9. Nếu đã cấu hình dịch vụ, upload ảnh hợp lệ/không hợp lệ trên Cloudinary; kiểm tra email nhận được qua SMTP.

Không dùng thanh toán thật hoặc dữ liệu production. Lookup key trả đơn chỉ thuộc khách đang đăng nhập; key không tồn tại hoặc thuộc khách khác đều trả 404. Dùng dữ liệu local/test khi kiểm thử.
