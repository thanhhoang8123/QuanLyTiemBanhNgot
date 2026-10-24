# Chức năng đã triển khai và cách kiểm thử

## Đã triển khai

- Đăng nhập theo phiên, mã hóa mật khẩu BCrypt, phân quyền theo vai trò và bảo vệ request thay đổi dữ liệu bằng CSRF.
- Đăng ký khách hàng và xác minh email; quản trị viên có giao diện quản lý tài khoản.
- POS tạo đơn có kiểm tra tồn kho; hủy đơn chờ xử lý hoàn tồn một lần. Nhận phiếu nhập cập nhật tồn nguyên liệu an toàn.
- Thanh toán mô phỏng `SUCCESS`/`FAILED`; kiểm soát điều kiện giao hàng, hoàn tất đơn và xử lý thao tác lặp.
- Gửi email xác minh và email tiếp nhận đơn sau khi transaction thành công.
- Trang shop hiển thị, tìm kiếm, lọc và sắp xếp sản phẩm. Chưa triển khai giỏ hàng/checkout trực tuyến cho khách.

## Tích hợp

- MySQL lưu dữ liệu nghiệp vụ; Flyway chạy migration và tạo dữ liệu test trong profile `dev`.
- MongoDB lưu nhật ký hoạt động và lịch sử trạng thái đơn.
- Cloudinary upload ảnh sản phẩm; kiểm tra định dạng JPG/PNG/WEBP và giới hạn 5 MB.
- SMTP gửi email. Cloudinary, MongoDB và SMTP cần cấu hình biến môi trường tương ứng khi kiểm thử tích hợp thật.
- Cấu hình `prod` yêu cầu thông tin dịch vụ qua biến môi trường; không lưu credential trong Git.

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
5. Trên POS, tạo đơn với sản phẩm còn hàng; kiểm tra đơn, tồn kho và email tiếp nhận. Thử vượt tồn, hủy đơn hai lần, thanh toán `FAILED` rồi `SUCCESS`, giao và hoàn tất đúng thứ tự.
6. Tạo và nhận phiếu nhập; xác nhận tồn nguyên liệu chỉ tăng một lần. Thử quyền quản lý tài khoản bằng tài khoản không phải ADMIN.
7. Nếu đã cấu hình dịch vụ, upload ảnh hợp lệ/không hợp lệ trên Cloudinary; kiểm tra nhật ký và lịch sử đơn trên MongoDB; kiểm tra email nhận được qua SMTP.

Không dùng thanh toán thật hoặc dữ liệu production. Luồng đặt hàng trực tuyến tại shop chưa có để kiểm thử.
