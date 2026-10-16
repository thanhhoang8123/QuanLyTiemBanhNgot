# Promotion products

Feature này dành cho giao diện liên kết khuyến mãi với sản phẩm nếu cần quản lý
liên kết riêng trên frontend.

- Đặt page, component và service dưới `features/promotion-products/` khi cần;
  route đăng ký tập trung trong `src/App.jsx`.
- Phối hợp với Promotions, Products và backend về hợp đồng API liên kết.
- Gọi API qua service của feature và `src/services/apiClient.js`.
- Không đặt secret hoặc kết nối database trực tiếp trong frontend.
