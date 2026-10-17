# Payments

- `pages/PaymentsPage.jsx` tải Payment và Order từ backend, tạo Payment cho đơn
  đủ điều kiện và cho phép mô phỏng kết quả `SUCCESS` hoặc `FAILED`.
- `services/paymentService.js` gọi `/api/payments`; dữ liệu Order được tải qua
  service Orders hiện có.
- Client chỉ gửi `orderId` và `paymentMethod`. Backend tính số tiền từ Order,
  khởi tạo Payment ở `PENDING` và giới hạn một Payment trên mỗi Order.
- Mô phỏng thành công đặt Payment thành `SUCCESS`, ghi `paidAt`, và đổi Order từ
  `PENDING` sang `CONFIRMED`. Mô phỏng thất bại đặt Payment thành `FAILED` nhưng
  không đổi trạng thái Order.
- Mô phỏng chỉ dùng để kiểm thử; không kết nối cổng thanh toán thật.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
