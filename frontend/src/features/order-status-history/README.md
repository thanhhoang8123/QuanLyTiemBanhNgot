# Order Status History

Feature này dành cho màn hình **đọc lịch sử chuyển trạng thái đơn hàng từ API
backend** khi endpoint và hợp đồng response được xác nhận. Frontend chỉ hiển thị
lịch sử do backend ghi nhận; không tạo dữ liệu lịch sử giả và không triển khai
logic ghi log/chuyển trạng thái tại feature này.

- Đặt page tại `features/order-status-history/pages/`.
- Đặt component chỉ phục vụ lịch sử trạng thái tại
  `features/order-status-history/components/`.
- Đặt API service tại `features/order-status-history/services/`, gọi HTTP qua
  `src/services/apiClient.js`.
- Phối hợp với Orders, Custom Orders và backend về định danh đơn, endpoint,
  phân trang, response và quyền truy cập.
- Không gọi database trực tiếp từ frontend và không lưu secret trong source code.

Hiện feature này chưa có UI hoặc API service trong frontend.
