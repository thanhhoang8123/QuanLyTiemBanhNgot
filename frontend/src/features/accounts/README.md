# Accounts

Feature này cung cấp màn hình quản lý tài khoản dành cho ADMIN.

- `pages/AccountsPage.jsx` hiển thị, tìm kiếm, tạo, sửa và xóa tài khoản.
- `services/accountService.js` gọi API accounts và roles qua `src/services/apiClient.js`.
- Route `/admin/accounts` trong `src/App.jsx` giới hạn ADMIN; backend tiếp tục kiểm tra quyền độc lập.
- Form gửi password mới dạng plaintext qua HTTPS/local API để backend hash bằng BCrypt; password/hash không được hiển thị trong response.
- Không lưu secret hoặc kết nối database trực tiếp trong frontend.
