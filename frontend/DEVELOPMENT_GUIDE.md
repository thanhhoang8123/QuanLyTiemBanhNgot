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
- `src/data/mockData.js`: dữ liệu đang được Dashboard, Orders và POS cùng dùng;
  giữ tại đây cho tới khi việc tách theo domain được xem xét riêng.

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
    custom-orders/README.md
    customers/README.md
    dashboard/
      components/
      pages/DashboardPage.jsx
    employees/README.md
    inventory/
      pages/InventoryPage.jsx
      services/ingredientService.js
    orders/pages/OrdersPage.jsx
    payments/README.md
    pos/
      components/
      pages/PosPage.jsx
    products/
      adapters/productAdapter.js
      components/ProductArtwork.jsx
      pages/ProductsPage.jsx
      services/productService.js
    promotion-products/README.md
    promotions/README.md
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
- Shop tải category và product qua API service dùng chung; đây là chức năng đọc
  danh mục/sản phẩm, không phải checkout.
- Dashboard, Orders và POS đang dùng dữ liệu/state mock. Orders cập nhật state
  phía frontend; POS mô phỏng giỏ hàng/checkout, không tạo đơn hay thanh toán
  thật.
- Customers, Payments, Custom Orders, Promotions, Promotion Products, Accounts,
  Employees, Roles, Activity Logs và Order Status History hiện chỉ có tài liệu
  định hướng trong feature folders; chưa có UI/service tương ứng trong frontend.

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
