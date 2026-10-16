# Promotions

Feature này dành cho giao diện quản lý và tra cứu khuyến mãi khi được triển khai.

- Đặt page, component, service và hook dưới `features/promotions/` khi cần; route
  đăng ký trong `src/App.jsx`.
- Phối hợp với Products, Orders và backend để thống nhất phạm vi áp dụng và API.
- Gọi API qua service của feature và `src/services/apiClient.js`.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
