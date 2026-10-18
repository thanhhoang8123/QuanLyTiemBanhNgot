# Promotions

Quản lý chương trình khuyến mãi theo API backend hiện có. Feature hỗ trợ danh
sách, tìm theo mã/tên, lọc trạng thái và khoảng thời gian, xem chi tiết, tạo,
cập nhật và xóa có xác nhận.

- Page: `pages/PromotionsPage.jsx`
- API service: `services/promotionService.js`
- Route: `/admin/promotions`, đăng ký trong `src/App.jsx`
- API service dùng `src/services/apiClient.js`; frontend không kết nối database.

Request theo backend gồm `promotionCode`, `name`, `discountPercent`,
`maxDiscount`, `minOrderValue`, `startDate`, `endDate`, `status`. Mức giảm tối
đa và giá trị đơn tối thiểu có thể để trống. Backend tìm mã không phân biệt hoa
thường và từ chối mã trùng. Unique constraint trên `promotion_code` cũng ngăn
mã trùng khi nhiều request tạo đồng thời. Ngày bắt đầu phải trước hoặc bằng
ngày kết thúc. Một promotion còn liên kết trong `promotion_products` không thể
xóa cho tới khi các liên kết được gỡ qua module tương ứng.

Trang không tự áp dụng khuyến mãi vào đơn hàng. Việc liên kết sản phẩm thuộc
feature `promotion-products`; tích hợp áp dụng giảm giá vào Orders cần được xác
minh riêng theo quy tắc nghiệp vụ trước khi triển khai.
