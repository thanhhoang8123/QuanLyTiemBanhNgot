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

## Chạy backend ở local bằng profile `dev`

Profile mặc định là `dev`. Profile này bật SQL logging và thêm migration seed
tài khoản test; chỉ dùng cho máy phát triển, không dùng profile này trên môi
trường công khai.

MySQL local trong `application.properties` tiếp tục là database nghiệp vụ.
MongoDB của profile `dev` kết nối Atlas thông qua biến môi trường `MONGODB_URI`,
được tham chiếu bởi `spring.mongodb.uri` trong cấu hình chung. Profile `dev`
không ghi đè URI này. Nếu biến thiếu, rỗng hoặc sai định dạng, ứng dụng dừng
sớm với thông báo hướng dẫn; URI không được ghi vào log. Cấu hình không tự
chuyển sang MongoDB local. SMTP không bắt buộc để khởi động, nhưng cần
`MAIL_USERNAME` và `MAIL_PASSWORD` để gửi email xác minh. Mô phỏng thanh toán
mặc định tắt ở mọi profile; dev chỉ bật khi chủ động đặt
`PAYMENT_SIMULATION_ENABLED=true`.

### Chuẩn bị Atlas một lần

1. Tạo cluster và database user trong MongoDB Atlas.
2. Trong **Network Access**, cho phép IP máy đang chạy backend.
3. Chọn **Connect > Drivers** và lấy connection string. Đặt database trong URI
   thành `quanlytiembanh_logs`; nếu mật khẩu có ký tự đặc biệt, mã hóa URL theo
   hướng dẫn của Atlas.
4. Không gửi URI/mật khẩu qua chat, không ghi vào file cấu hình/repository và
   không commit giá trị thật.

### Khởi động trên Windows PowerShell

Mở PowerShell tại thư mục backend, đặt URI Atlas cho phiên terminal hiện tại,
rồi chạy profile `dev`:

```powershell
Set-Location D:\QuanLyTiemBanhNgot\backend
$env:SPRING_PROFILES_ACTIVE = "dev"
$env:MONGODB_URI = "mongodb+srv://<database-user>:<password>@<cluster-host>/quanlytiembanh_logs?retryWrites=true&w=majority"
.\mvnw.cmd spring-boot:run
```

Thay phần trong dấu `<...>` bằng thông tin Atlas của bạn; không lưu dòng chứa
URI thật vào tài liệu, script hoặc Git. Các biến đặt bằng `$env:` chỉ được tiến
trình backend khởi chạy từ terminal này kế thừa. Muốn chạy từ một terminal mới,
cần đặt lại biến hoặc cấu hình biến môi trường cá nhân trên Windows.

### Khởi chạy bằng VS Code Java debugger

Workspace có cấu hình **WA Patisserie (dev)** trong `.vscode/launch.json`;
cấu hình này nạp biến từ `backend/.env` và chọn profile `dev`. Tạo file
`backend/.env` trên máy cá nhân (file này được Git bỏ qua), với nội dung theo
dạng sau, thay bằng URI thật lấy từ Atlas:

```dotenv
MONGODB_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/quanlytiembanh_logs?retryWrites=true&w=majority
```

Không thêm dấu nháy quanh giá trị, không để nguyên dấu `<...>`, và không chia sẻ
file này. Nếu dùng MongoDB không phải Atlas, URI cần có scheme `mongodb://`.
Sau đó mở **Run and Debug**, chọn **WA Patisserie (dev)** và khởi chạy. Biến
đặt trong một terminal PowerShell riêng không tự được truyền vào VS Code đã
đang chạy; hãy dùng file env cục bộ nói trên hoặc mở VS Code từ chính terminal
đã đặt biến môi trường.

Nếu cần gửi email xác minh, đặt thêm `MAIL_USERNAME` và `MAIL_PASSWORD` trong
terminal đó. Dùng Gmail App Password, không dùng mật khẩu Gmail thông thường.
API mô phỏng thanh toán mặc định vẫn tắt trong profile `dev`; chỉ bật tạm thời
cho kiểm thử thủ công bằng `$env:PAYMENT_SIMULATION_ENABLED = "true"`. Không
đặt biến này trong môi trường production.

## Theo dõi collection MongoDB bằng Compass

MySQL vẫn là database nghiệp vụ cho khách hàng, sản phẩm, đơn hàng, thanh toán
và kho. MongoDB Atlas chỉ lưu các document nhật ký/lịch sử:

- `order_status_histories` dành cho các lần thay đổi thật của trạng thái đơn
  bán (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`); trạng thái giao hàng là
  trường riêng.
- `activity_logs` lưu các sự kiện nghiệp vụ như thay đổi trạng thái phiếu nhập
  với `entityType=PURCHASE_ORDER`; ID phiếu nhập không được dùng làm ID đơn bán.
- Document legacy không bị xóa. Backend ghi MongoDB sau khi transaction MySQL
  commit; nếu ghi Mongo thất bại, MySQL không bị rollback và lỗi được ghi vào
  backend log.

Trong MongoDB Compass, dùng connection string Atlas lấy từ **Connect > Compass**
(hoặc connection string Atlas của bạn), kết nối, rồi xem database
`quanlytiembanh_logs`. Collection có thể chỉ xuất hiện sau lần ghi đầu tiên.
Thực hiện một thao tác phù hợp trên ứng dụng rồi refresh Compass:
`order_status_histories` cho lịch sử đơn bán, `activity_logs` cho nhật ký phiếu
nhập. Không chia sẻ URI thật hoặc đưa URI vào repository.

## Cấu hình production

Production phải chạy với `SPRING_PROFILES_ACTIVE=prod`. Profile này không nạp
migration seed dev, tắt SQL logging, bật cookie session `Secure` và yêu cầu các
biến cấu hình sau; nếu thiếu, Spring Boot sẽ dừng khi khởi động thay vì dùng
localhost hoặc credential trống:

| Biến môi trường | Mục đích |
| --- | --- |
| `DB_URL` | JDBC URL của MySQL production |
| `DB_USERNAME` | Tài khoản MySQL riêng cho ứng dụng |
| `DB_PASSWORD` | Mật khẩu MySQL |
| `MONGODB_URI` | URI kết nối MongoDB cho lịch sử hoạt động |
| `MAIL_USERNAME` | Tài khoản SMTP gửi email xác minh |
| `MAIL_PASSWORD` | SMTP password/App Password |
| `FRONTEND_URL` | Origin frontend production dùng trong email xác minh |
| `VNPAY_TMN_CODE` | Mã merchant VNPay production |
| `VNPAY_HASH_SECRET` | Khóa ký callback VNPay production |
| `VNPAY_PAYMENT_URL` | URL thanh toán do VNPay production cung cấp |
| `VNPAY_QUERY_URL` | URL truy vấn giao dịch do VNPay production cung cấp |
| `VNPAY_RETURN_URL` | Return URL HTTPS của backend production |
| `VNPAY_IPN_URL` | IPN URL HTTPS của backend production |

Profile production không bật API mô phỏng thanh toán. Ngay cả khi deployment
quên đặt `SPRING_PROFILES_ACTIVE=prod`, profile mặc định `dev` cũng không bật
mô phỏng nếu không có biến `PAYMENT_SIMULATION_ENABLED=true`. Đảm bảo file
`application-prod.properties` được đưa vào artifact phát hành và luôn đặt profile
production rõ ràng. Không dùng thông tin sandbox, URL ngrok hoặc secret dev
trong production. Cấu hình VNPAY phải lấy từ merchant production đã được cấp;
nếu chưa có, chưa nên mở thanh toán VNPay thật.

Ví dụ PowerShell (thay giá trị mẫu bằng cấu hình từ secret manager của môi
trường deploy, không lưu các giá trị này vào repository):

```powershell
$env:SPRING_PROFILES_ACTIVE = "prod"
$env:DB_URL = "jdbc:mysql://db.example.invalid:3306/production_db?serverTimezone=UTC&sslMode=VERIFY_IDENTITY"
$env:DB_USERNAME = "app_user"
$env:DB_PASSWORD = "set-from-secret-manager"
$env:MONGODB_URI = "mongodb+srv://user:password@cluster.example.invalid/quanlytiembanh_logs"
$env:MAIL_USERNAME = "your-email@example.com"
$env:MAIL_PASSWORD = "set-from-secret-manager"
$env:FRONTEND_URL = "https://shop.example.invalid"
$env:VNPAY_TMN_CODE = "set-from-secret-manager"
$env:VNPAY_HASH_SECRET = "set-from-secret-manager"
$env:VNPAY_PAYMENT_URL = "https://provider-production.example.invalid/payment"
$env:VNPAY_QUERY_URL = "https://provider-production.example.invalid/query"
$env:VNPAY_RETURN_URL = "https://api.example.invalid/api/payments/vnpay/return"
$env:VNPAY_IPN_URL = "https://api.example.invalid/api/payments/vnpay/ipn"
.\mvnw.cmd spring-boot:run
```

Cloudinary vẫn là tùy chọn; upload ảnh chỉ hoạt động khi đủ ba biến Cloudinary
ở phần trên. Nếu credential Cloudinary từng bị ghi trực tiếp vào file cấu hình
hoặc chia sẻ ra ngoài kênh bí mật, hãy thu hồi và tạo credential mới trước khi
dùng lại.
