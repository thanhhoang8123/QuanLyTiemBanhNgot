WA PATISSERIE - PHASE 1: CUSTOMER REGISTRATION + EMAIL VERIFICATION

LƯU Ý
- Đây là gói patch chỉ chứa các file mới/thay đổi, không phải bản ZIP toàn dự án.
- Sao lưu dự án và database trước khi chép file.
- Chép đúng đường dẫn tương đối trong thư mục backend/ và frontend/.
- Chưa triển khai đăng nhập session HttpOnly/CSRF, giỏ hàng và checkout ở bước này.
- Chưa chạy được Maven compile trong môi trường tạo patch vì lệnh mvn không có sẵn; cần kiểm tra build trên máy phát triển trước khi dùng.

CÁC THAY ĐỔI
1. Thêm Spring Mail dependency.
2. Thêm trường email, emailVerified, customer vào Account.
3. Thêm CUSTOMER role và bảng token xác minh qua Flyway migration.
4. POST /api/auth/register tạo Customer + Account trạng thái PENDING_VERIFICATION, gửi email.
5. POST /api/auth/verify-email xác minh token (token chỉ lưu dạng SHA-256, hết hạn 30 phút, dùng một lần).
6. Tài khoản CUSTOMER chưa xác minh không thể đăng nhập; tài khoản admin/manager/staff hiện có không bị ảnh hưởng bởi điều kiện này.
7. Thêm trang /shop/register và /shop/verify-email; giữ màu kem-nâu của cửa hàng.

BIẾN MÔI TRƯỜNG BACKEND
MAIL_USERNAME=địa_chỉ_gmail_của_bạn
MAIL_APP_PASSWORD=mật_khẩu_ứng_dụng_16_ký_tự
FRONTEND_URL=http://localhost:5173

Dùng Google App Password, không dùng mật khẩu Gmail thông thường. Không ghi mật khẩu thật vào Git hoặc gửi trong chat.

API ĐĂNG KÝ
POST /api/auth/register
{
  "username": "khachhang01",
  "password": "MatKhauAnToan123",
  "fullName": "Nguyen Thi An",
  "email": "email-that-cua-ban@example.com",
  "phone": "0900000000",
  "address": "TP. Ho Chi Minh"
}

API XÁC MINH
POST /api/auth/verify-email
{
  "token": "token-lay-tu-link-trong-email"
}

TRƯỚC KHI CHẠY
- Kiểm tra database quanlytiembanhngot đang có bảng accounts, customers, roles đúng schema như dự án.
- Sao lưu database; Flyway sẽ tự chạy V20261019_1__customer_email_verification.sql khi backend khởi động.
- Cấu hình MAIL_USERNAME, MAIL_APP_PASSWORD và FRONTEND_URL trong môi trường chạy backend.
- Nếu backend khởi động lỗi migration, dừng lại và gửi nguyên lỗi; không tự xóa bảng hoặc sửa lịch sử Flyway.
- Sau khi backend build thành công, thử đăng ký bằng email thật, mở link xác minh rồi kiểm tra đăng nhập.
