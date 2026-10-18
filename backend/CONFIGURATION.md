# Cấu hình local cho backend

## Dùng chung Cloudinary

Mỗi thành viên cần được cấp cùng bộ `cloud name`, `API key` và `API secret` của
Cloudinary qua kênh riêng tư của nhóm. Không gửi `API secret` trong chat nhóm,
không ghi vào source code, `application.properties`, Postman collection hoặc
file được commit.

Spring Boot nhận các biến môi trường sau qua các property trong
`src/main/resources/application.properties`:

| Biến môi trường | Spring property |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | `cloudinary.cloud-name` |
| `CLOUDINARY_API_KEY` | `cloudinary.api-key` |
| `CLOUDINARY_API_SECRET` | `cloudinary.api-secret` |

Cloud name sẽ được trim khoảng trắng ở đầu/cuối trước khi tạo Cloudinary client.
Không chèn dấu cách vào giữa cloud name.

### Thiết lập tạm trong PowerShell

Thay các giá trị mẫu bằng credential được nhóm cấp. Các biến chỉ tồn tại trong
cửa sổ PowerShell hiện tại và được tiến trình Spring Boot khởi chạy từ cửa sổ
đó kế thừa:

```powershell
$env:CLOUDINARY_CLOUD_NAME = "your-cloud-name"
$env:CLOUDINARY_API_KEY = "your-api-key"
$env:CLOUDINARY_API_SECRET = "your-api-secret"
.\mvnw.cmd spring-boot:run
```

### Thiết lập lâu dài cho tài khoản Windows

Trong PowerShell, đặt từng biến ở phạm vi `User` (không dùng `Machine`, vốn
không cần quyền quản trị). Thay các giá trị mẫu bằng credential thật:

```powershell
[Environment]::SetEnvironmentVariable("CLOUDINARY_CLOUD_NAME", "your-cloud-name", "User")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_KEY", "your-api-key", "User")
[Environment]::SetEnvironmentVariable("CLOUDINARY_API_SECRET", "your-api-secret", "User")
```

Đóng và mở lại VS Code/terminal sau khi thiết lập để tiến trình mới nhận được
biến. Sau đó chạy backend từ terminal mới:

```powershell
.\mvnw.cmd spring-boot:run
```

Không đưa giá trị credential thật vào tài liệu, commit, ảnh chụp màn hình hoặc
lệnh được chia sẻ với nhóm. Nếu credential bị lộ, hãy thu hồi và tạo lại trong
Cloudinary Console.

## Chạy backend khi chưa có Cloudinary

Cloudinary không bắt buộc để khởi động backend. Khi thiếu một hoặc nhiều biến,
các API nghiệp vụ vẫn có thể hoạt động; `POST /api/uploads/products` trả HTTP
503 với thông báo yêu cầu cấu hình Cloudinary. Muốn upload ảnh, cần thiết lập đủ
cả ba biến rồi khởi động lại backend.

Endpoint upload tiếp tục chỉ nhận JPG, PNG hoặc WEBP, giới hạn file 5 MB và trả
`secure_url` do Cloudinary cung cấp khi upload thành công.
