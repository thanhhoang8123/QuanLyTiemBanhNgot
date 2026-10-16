# Payments

Feature này dành cho giao diện thanh toán khi nghiệp vụ được đưa lên frontend.

- Đặt page, component, service và hook dưới `features/payments/` khi cần; route
  đăng ký trong `src/App.jsx`.
- Phối hợp với Orders, POS và backend để thống nhất trạng thái và API thanh toán.
- Gọi API qua service của feature và `src/services/apiClient.js`.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
