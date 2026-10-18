# Promotion Products

Trang quản trị tại `/admin/promotion-products` dùng dữ liệu API để:

- Xem và tìm liên kết khuyến mãi - sản phẩm; lọc theo chương trình khuyến mãi.
- Tạo một liên kết bằng cách chọn chương trình và sản phẩm chưa được gắn với
  chương trình đó.
- Gỡ liên kết sau khi xác nhận. Việc này không xóa sản phẩm hoặc khuyến mãi.

Service trong feature gọi `GET`, `POST` và `DELETE /api/promotion-products`
thông qua `src/services/apiClient.js`. Danh sách khuyến mãi và sản phẩm được
tải từ service hiện có để hiển thị tên, mã và trạng thái; không thêm trường hay
endpoint cho API liên kết.

Backend là nơi kiểm tra hai ID tồn tại và từ chối cặp đã có. Giao diện ẩn sản
phẩm đã liên kết khỏi lựa chọn để tránh thao tác trùng thông thường; lỗi trùng
do backend trả về vẫn được hiển thị nếu có request đồng thời.
