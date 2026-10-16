# Customers

Feature này dành cho giao diện và tương tác frontend quản lý khách hàng khi
được triển khai.

- Đặt page, component, service và hook dưới `features/customers/` khi cần; route
  vẫn đăng ký tập trung trong `src/App.jsx`.
- Phối hợp với Orders, POS và backend để thống nhất hợp đồng API khách hàng.
- Dùng `src/services/apiClient.js` qua service của feature.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
