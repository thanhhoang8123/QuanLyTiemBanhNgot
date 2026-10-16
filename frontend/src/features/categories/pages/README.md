# Categories pages

Feature categories hiện có service đọc danh mục nhưng chưa có trang quản trị
danh mục. Khi UI được thống nhất, đặt page tại thư mục này và đăng ký URL trong
`src/App.jsx`.

Dùng `features/categories/services/` cho API danh mục hiện có; phối hợp với
Products và Shop vì hai feature này sử dụng dữ liệu danh mục. Không gọi API trực
tiếp từ page và không đặt secret hoặc kết nối database trong frontend.
