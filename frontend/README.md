# WA Pâtisserie — Frontend

Frontend được xây dựng bằng React, JavaScript JSX, Vite, Tailwind CSS và React
Router. Bắt đầu từ thư mục `frontend/`:

```powershell
npm install
npm run dev
```

Chạy `npm run build` để kiểm tra bản production.

## Tìm code nhanh

- `src/App.jsx`: đăng ký route.
- `src/layouts/`: layout Admin/POS và Shop.
- `src/features/<domain>/`: code theo nghiệp vụ; xem các README trong feature
  folders để biết module nào mới chỉ được chuẩn bị.
- `src/components/`: UI dùng chung.
- `src/services/apiClient.js`: HTTP client dùng qua API service của từng feature.
- `src/data/mockData.js`: mock hiện được Dashboard, Orders và POS chia sẻ.

Đọc [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) trước khi thêm page, route,
API service hoặc component dùng chung. Tài liệu mô tả phạm vi frontend hiện có;
không đồng nghĩa các API/backend đã được kiểm thử hoặc các module ghi là đang
chuẩn bị đã triển khai.
