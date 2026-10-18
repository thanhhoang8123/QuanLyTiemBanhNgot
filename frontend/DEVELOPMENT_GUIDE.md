# Hướng dẫn phát triển frontend

## Tìm đúng nơi để làm việc

- `src/App.jsx`: khai báo route, layout route và state được chia sẻ giữa nhiều
  trang. Không đặt toàn bộ nghiệp vụ của từng page tại đây.
- `src/main.jsx`: khởi chạy React và `BrowserRouter`.
- `src/index.css`: Tailwind CSS và theme nền toàn ứng dụng.
- `src/layouts/`: khung tổng thể cho từng khu vực. Admin/POS dùng `AppLayout`;
  Shop dùng `ShopLayout`.
- `src/layouts/app/`: Sidebar và Topbar chỉ phục vụ `AppLayout`.
- `src/pages/NotFoundPage.jsx`: fallback cấp ứng dụng.
- `src/components/`: UI primitive hoặc component dùng chung thực sự giữa nhiều
  feature.
- `src/features/<domain>/`: page, component, service, hook, adapter hoặc mock
  thuộc một nghiệp vụ.
- `src/services/apiClient.js`: HTTP client dùng chung; feature API gọi client này
  thông qua service riêng.
- `src/data/mockData.js`: Dashboard và các màn hình prototype còn dùng dữ liệu
  mẫu; POS và Orders không dùng mock thay cho dữ liệu bán hàng backend.

### Cấu trúc hiện có

```text
src/
  App.jsx
  main.jsx
  index.css
  components/
  data/mockData.js
  layouts/
    AppLayout.jsx
    ShopLayout.jsx
    app/
      Sidebar.jsx
      Topbar.jsx
  pages/NotFoundPage.jsx
  services/apiClient.js
  features/
    accounts/README.md
    categories/
      pages/README.md
      services/categoryService.js
    custom-orders/
      README.md
      pages/CustomOrdersPage.jsx
      services/customOrderService.js
    customers/
      pages/CustomersPage.jsx
      services/customerService.js
    dashboard/
      components/
      pages/DashboardPage.jsx
    employees/README.md
    inventory/
      pages/InventoryPage.jsx
      services/ingredientService.js
    orders/
      pages/OrdersPage.jsx
      services/orderService.js
    payments/
      README.md
      pages/PaymentsPage.jsx
      services/paymentService.js
    pos/
      components/CartPanel.jsx
      components/ProductCard.jsx
      pages/PosPage.jsx
    products/
      adapters/productAdapter.js
      components/ProductArtwork.jsx
      pages/ProductsPage.jsx
      services/productService.js
    promotion-products/
      README.md
      pages/PromotionProductsPage.jsx
      services/promotionProductService.js
    promotions/
      pages/PromotionsPage.jsx
      services/promotionService.js
    purchase-orders/
      pages/PurchaseOrdersPage.jsx
      services/purchaseOrderService.js
    roles/README.md
    shop/
      components/
      hooks/useShopCatalog.js
      pages/
    suppliers/
      pages/SuppliersPage.jsx
      services/supplierService.js
```

Thư mục con chỉ cần tạo khi có nội dung thật; không tạo file code rỗng hoặc
service/hook/component giả chỉ để làm cây thư mục đồng đều.

## Trạng thái chức năng đã xác minh trong frontend

- Products page gọi service đọc/tạo/cập nhật/ngừng kinh doanh sản phẩm và upload
  ảnh; request/response được chuyển đổi qua product adapter.
- Inventory, Suppliers và Purchase Orders có page gọi service tương ứng.
- Category hiện có service đọc danh mục và được Products/Shop sử dụng; chưa có
  trang quản trị category.
- Customers có page quản lý hồ sơ và service gọi API backend. Trạng thái và điểm
  tích lũy chỉ được hiển thị; page không gửi các trường này khi tạo/cập nhật.
- Custom Orders có page/service gọi API backend để tiếp nhận, xem, cập nhật,
  chuyển trạng thái và xóa đơn bánh thiết kế riêng độc lập với POS.
- Promotions có page/service gọi API backend để tìm kiếm, lọc, xem chi tiết,
  tạo, cập nhật và xóa chương trình khuyến mãi. Thao tác áp dụng promotion vào
  Orders chưa được tích hợp.
- Promotion Products có page/service dùng API backend để xem, tìm kiếm, lọc,
  tạo và gỡ liên kết giữa chương trình khuyến mãi với sản phẩm.
- Shop tải category và product qua API service dùng chung; đây là chức năng đọc
  danh mục/sản phẩm, không phải checkout.
- Orders tải danh sách/chi tiết, tạo đơn và báo giá qua API backend. Backend
  lấy giá, kiểm tra/trừ tồn kho trong transaction và tính promotion; đơn PENDING
  có thể hủy để hoàn kho. Chi tiết đơn cho phép cập nhật số lượng khi còn đủ
  điều kiện; backend đồng bộ tồn và tổng tiền, từ chối sửa nếu có Payment.
- POS tải Products, Customers và Employees thật. Backend báo giá mã Promotion,
  tạo Order có ghi chú và tính lại khi tạo; sau đó POS tạo Payment, mô phỏng
  `SUCCESS`/`FAILED` theo flow hiện có. Đơn thanh toán thất bại giữ tồn để thử
  lại; hủy đơn PENDING xóa Payment chưa thành công và hoàn tồn. Không kết nối
  cổng thanh toán thật.
- Payments tải Payment/Order qua API backend, tạo thanh toán cho đơn đủ điều
  kiện và mô phỏng kết quả `SUCCESS`/`FAILED`. Thành công đổi Order từ `PENDING`
  sang `CONFIRMED`; thất bại không làm thay đổi trạng thái Order. Đây không phải
  tích hợp cổng thanh toán thật.
- Dashboard và một số màn hình prototype vẫn dùng dữ liệu/state mock.
- Accounts, Employees, Roles, Activity Logs và Order Status History hiện chỉ có
  tài liệu định hướng trong feature folders; chưa có UI/service tương ứng trong
  frontend.

Tài liệu này mô tả code frontend hiện có, không khẳng định API backend đã được
kiểm thử hoặc nghiệp vụ đã hoàn tất.

## Quy tắc đặt tên và tổ chức

- Page và component JSX dùng PascalCase, ví dụ `ProductsPage.jsx`.
- Service, adapter và hàm dùng camelCase, ví dụ `productService.js`,
  `toProductViewModel`.
- Custom hook bắt đầu bằng `use`, ví dụ `useShopCatalog.js`.
- Dùng JavaScript/JSX; không thêm TypeScript/TSX.
- Page đặt tại `features/<domain>/pages/`; component chỉ phục vụ domain đặt tại
  `features/<domain>/components/`.
- Component được nhiều feature dùng mới đặt tại `components/`. Trước khi tạo
  component mới, tìm component tương đương để tránh tạo nguồn thứ hai.
- API service đặt tại `features/<domain>/services/`. Chỉ đặt HTTP client chung
  tại `services/apiClient.js`.
- Adapter đặt tại `features/<domain>/adapters/` khi thực sự cần chuyển đổi dữ
  liệu giữa API và giao diện.
- Hook đặt trong feature sở hữu logic. Chỉ tạo hook dùng chung nếu nhiều feature
  thực sự cùng sử dụng.
- Mock riêng feature có thể đặt trong `features/<domain>/mocks/`; không chuyển
  dữ liệu đang dùng chung trong `data/mockData.js` như một phần tái cấu trúc
  thông thường.

## Đăng ký route

1. Tạo page trong `src/features/<domain>/pages/`.
2. Import page trong `src/App.jsx` và thêm route tại layout phù hợp.
3. Giữ Admin/POS dưới `AppLayout`, Shop dưới `ShopLayout`.
4. Giữ route hiện có nếu không có yêu cầu thay đổi đã được duyệt; route không
   khớp tiếp tục đi tới `NotFoundPage`.
5. Không tạo router riêng cho feature.

## Gọi API qua service

Page/component không gọi `fetch` trực tiếp. Tạo hoặc dùng service của domain,
service đó dùng `apiRequest` từ `src/services/apiClient.js`:

```js
import { apiRequest } from '../../../services/apiClient.js'

export function getItems({ signal } = {}) {
  return apiRequest('/items', { signal })
}
```

Đường dẫn mẫu trên chỉ minh họa cách gọi; trước khi thêm API cần xác nhận
endpoint, method và request/response với backend. Không khai báo lại endpoint
đã có, không đổi API contract ngoài phạm vi được duyệt, và không gọi database
trực tiếp từ frontend.

## Loading, error và empty state

- Luồng tải bất đồng bộ cần thể hiện riêng trạng thái đang tải, lỗi và danh sách
  rỗng; lỗi cần thông báo hữu ích và cho phép thử lại nếu phù hợp.
- Có thể tái sử dụng `LoadingState`, `ErrorState`, `EmptyState`; `DataTable` đã
  dùng `EmptyState` cho bảng rỗng.
- `PageHeader`, `SearchFilter`, `FormField` và `ConfirmDialog` hiện là component
  dùng chung sẵn có nhưng chưa được các page nghiệp vụ sử dụng trực tiếp rộng
  rãi. Dùng khi phù hợp, không tạo bản thay thế trùng chức năng.
- Dùng `onToast(message)` cấp ứng dụng cho thông báo thao tác; không tạo hệ thống
  toast thứ hai. Không biểu diễn lỗi API bằng thông báo thành công.

## Dùng mock data đúng cách

- Giữ mock và API tách biệt: page mock dùng state/mock data; page gọi backend
  đi qua service. Không âm thầm dùng mock như fallback khi API lỗi.
- `data/mockData.js` hiện được Dashboard, Orders và POS chia sẻ. Giữ nguyên cấu
  trúc và giá trị khi thay đổi không liên quan; nếu tách mock, lập thay đổi riêng
  và cập nhật mọi consumer.
- Không ghi nhận giao dịch thật, lịch sử hoặc thành công giả trong UI mock.
- Khi module chuyển từ mock sang API, thống nhất với nhóm về endpoint, dữ liệu và
  trạng thái trước; kiểm tra riêng các đường lỗi và trạng thái tải.

## Build và phối hợp nhóm

Từ thư mục `frontend/`, chạy trước khi commit:

```powershell
npm run build
```

Sau khi di chuyển/đổi tên file, tìm import trỏ tới đường dẫn cũ và xác nhận route
được giữ nguyên. `package.json` hiện không có script test frontend; không báo
đã chạy test nếu chưa có test runner được cấu hình.

Trao đổi với nhóm trước khi thay đổi file nền tảng:

- `src/App.jsx`, `src/main.jsx`, `src/index.css`
- `src/layouts/` và `src/components/`
- `src/services/apiClient.js`, `vite.config.js`
- `src/data/mockData.js`
- `package.json`, `package-lock.json`

Không tự cài package, đổi phiên bản thư viện, API endpoint, layout chung hoặc
theme nền trong một thay đổi chỉ nhằm tổ chức code.
