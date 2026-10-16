# Employees

Feature này dành cho giao diện quản lý nhân viên khi được triển khai trên
frontend.

- Đặt page, component, service và hook dưới `features/employees/` khi cần; route
  đăng ký trong `src/App.jsx`.
- Phối hợp với Accounts, Roles và backend về dữ liệu nhân viên và API liên quan.
- Gọi API qua service của feature và `src/services/apiClient.js`.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
