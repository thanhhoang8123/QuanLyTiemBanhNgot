# Activity Logs

Feature này dành cho màn hình **đọc lịch sử hoạt động từ API backend** khi
endpoint và hợp đồng dữ liệu được nhóm xác nhận. Frontend chỉ truy vấn và hiển
thị bản ghi do backend cung cấp; không tạo dữ liệu lịch sử giả và không tự ghi
log nghiệp vụ.

- Đặt page tại `features/activity-logs/pages/`.
- Đặt component chỉ phục vụ màn hình này tại
  `features/activity-logs/components/`.
- Đặt API service tại `features/activity-logs/services/`, gọi HTTP qua
  `src/services/apiClient.js`.
- Phối hợp với backend về endpoint, bộ lọc, phân trang, quyền truy cập và cấu
  trúc response; phối hợp với Accounts/Employees nếu cần hiển thị tác nhân.
- Không gọi database trực tiếp từ frontend và không lưu secret trong source code.

Hiện feature này chưa có UI hoặc API service trong frontend.
