# Custom orders

Feature này dành cho giao diện đơn đặt bánh riêng khi được triển khai.

- Đặt page, component, service và hook dưới `features/custom-orders/` khi cần;
  đăng ký route tập trung trong `src/App.jsx`.
- Phối hợp với Customers, Orders, Products và backend về quy trình/trạng thái và
  hợp đồng API.
- Dùng `src/services/apiClient.js` thông qua service của feature.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
