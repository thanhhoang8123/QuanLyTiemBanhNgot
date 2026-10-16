# Roles

Feature này dành cho giao diện quản lý vai trò khi phạm vi phân quyền frontend
được thống nhất.

- Đặt page, component, service và hook dưới `features/roles/` khi cần; route
  đăng ký tập trung trong `src/App.jsx`.
- Phối hợp với Accounts, Employees và backend về vai trò, quyền và hợp đồng API.
- Dùng `src/services/apiClient.js` thông qua service của feature.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
