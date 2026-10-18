# Custom Orders

Trang quản trị `/admin/custom-orders` quản lý các đơn bánh thiết kế riêng độc
lập với luồng bán hàng POS:

- Xem, tìm kiếm, lọc trạng thái và xem chi tiết đơn.
- Tạo/cập nhật yêu cầu bánh, khách hàng, nhân viên tiếp nhận, thời điểm giao,
  giá dự kiến và tiền cọc.
- Chuyển trạng thái theo các bước được backend cho phép; xóa chỉ áp dụng cho
  đơn `PENDING`.

Page tải dữ liệu thật qua `customOrderService.js`, `customerService.js` và API
`/employees`. Backend quản lý `orderDate`, khởi tạo trạng thái `PENDING`, xác
nhận quan hệ đang hoạt động, giới hạn giá trị tiền/ngày giao, quy tắc chuyển
trạng thái và quyền xóa. Frontend không tạo trạng thái hoặc tự hoàn tất đơn.
