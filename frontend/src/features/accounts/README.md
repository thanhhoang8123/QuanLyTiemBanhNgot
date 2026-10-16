# Accounts

Feature này dành cho giao diện tài khoản người dùng khi phạm vi frontend được
thống nhất.

- Đặt page, component, service và hook dưới `features/accounts/` khi cần; route
  đăng ký tập trung trong `src/App.jsx`.
- Phối hợp với Roles, Employees và backend về API, xác thực và quyền truy cập.
- Dùng `src/services/apiClient.js` thông qua service của feature.
- Không lưu secret hoặc kết nối database trực tiếp trong frontend.
