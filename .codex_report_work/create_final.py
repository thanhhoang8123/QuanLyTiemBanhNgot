from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.text.paragraph import Paragraph
from PIL import Image, ImageDraw, ImageFont
import shutil, re, textwrap, math

ROOT = Path(r'D:\QuanLyTiemBanhNgot')
SRC = Path(r'C:\Users\ASUS\Downloads\Bao_cao_WA_Patisserie_hoan_chinh_co_vi_tri_chup_hinh.docx')
OUT = ROOT / 'Bao_cao_WA_Patisserie_ban_hoan_thien.docx'
WORK = ROOT / '.codex_report_work'
FIG = WORK / 'figures'
FIG.mkdir(parents=True, exist_ok=True)
shutil.copy2(SRC, OUT)
doc = Document(OUT)

# All figures use the report's warm palette and are rasterized at print resolution.
W, H = 1800, 980
BG, INK, MUTED, ACC = '#FCF9F3', '#3F2B27', '#725D56', '#B7835E'
WHITE, CREAM, PINK, BLUE, GREEN, LINE = '#FFFFFF', '#F2E6D8', '#FAF0EE', '#536C80', '#58745B', '#A68A7A'
FONTDIR = Path(r'C:\Windows\Fonts')
def ft(size, bold=False):
    return ImageFont.truetype(str(FONTDIR / ('arialbd.ttf' if bold else 'arial.ttf')), size)
def base(title, subtitle=''):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    d.text((65, 34), title, font=ft(42, True), fill=INK)
    if subtitle: d.text((68, 91), subtitle, font=ft(22), fill=MUTED)
    d.rounded_rectangle((60, 140, W-60, H-35), radius=22, fill='#FFFEFC', outline='#D8C8BA', width=3)
    return im, d
def card(d, b, title, lines, accent=ACC, fill=WHITE):
    x1,y1,x2,y2=b; d.rounded_rectangle(b, radius=18, fill=fill, outline=accent, width=3)
    d.rounded_rectangle((x1,y1,x2,y1+55), radius=16, fill=accent); d.rectangle((x1,y1+32,x2,y1+55), fill=accent)
    d.text((x1+17,y1+9), title, font=ft(24,True), fill=WHITE)
    y=y1+68
    for line in lines: d.text((x1+18,y), line, font=ft(20), fill=INK); y+=31
def arrow(d, a, b, label='', color=LINE):
    x1,y1=a; x2,y2=b; d.line((x1,y1,x2,y2), fill=color, width=4)
    angle=math.atan2(y2-y1,x2-x1); n=17
    p1=(x2-n*math.cos(angle-math.pi/6),y2-n*math.sin(angle-math.pi/6))
    p2=(x2-n*math.cos(angle+math.pi/6),y2-n*math.sin(angle+math.pi/6))
    d.polygon([(x2,y2),p1,p2],fill=color)
    if label:
        mx,my=(x1+x2)//2,(y1+y2)//2; d.rounded_rectangle((mx-65,my-16,mx+65,my+16),radius=7,fill='#FFFEFC')
        d.text((mx-57,my-13),label,font=ft(16,True),fill=MUTED)

# Three ERD panels, based on the repository's ERD markdown.
im,d=base('ERD 1 | Tài khoản và khách hàng','Các bảng MySQL; tên và khóa được đối chiếu với ERD_HeThongQuanLyBanhNgot.md')
b={'roles':(105,220,625,410),'accounts':(650,220,1170,445),'customers':(1195,220,1715,425),'employees':(650,610,1170,825),'contact_messages':(1195,610,1715,830),'newsletter_subscriptions':(105,610,625,820)}
card(d,b['roles'],'roles',['PK id','role_code, name'])
card(d,b['accounts'],'accounts',['PK id','FK role_id','FK customer_id (NULL)','UNIQUE username/email'])
card(d,b['customers'],'customers',['PK id','full_name, email, phone','loyalty_points, status'])
card(d,b['employees'],'employees',['PK id','FK account_id (UNIQUE)','employee profile'])
card(d,b['contact_messages'],'contact_messages',['PK id','FK customer_id (NULL)','subject, status'])
card(d,b['newsletter_subscriptions'],'newsletter_subscriptions',['PK id','UNIQUE email','active, consented_at'])
arrow(d,(625,315),(650,315),'1:N'); arrow(d,(1170,335),(1195,335),'N:1'); arrow(d,(910,445),(910,610),'0..1:1'); arrow(d,(1450,425),(1450,610),'1:N')
d.text((150,875),'Ghi chú: accounts.customer_id không UNIQUE; customer có thể liên kết nhiều account.',font=ft(20,True),fill=BLUE)
im.save(FIG/'erd_identity.png',dpi=(300,300))

im,d=base('ERD 2 | Danh mục, đơn hàng và thanh toán','Promotion-Product là quan hệ nhiều-nhiều qua promotion_products; Payment.order_id UNIQUE.')
b={'categories':(80,205,600,375),'products':(640,205,1160,405),'promotions':(1200,205,1720,375),'promotion_products':(80,485,600,700),'orders':(640,485,1160,720),'order_items':(1200,485,1720,700),'attempts':(80,775,600,945),'payments':(640,775,1160,945),'custom_orders':(1200,775,1720,945)}
card(d,b['categories'],'categories',['PK id','name, status'])
card(d,b['products'],'products',['PK id','FK category_id','product_code, price, quantity'])
card(d,b['promotions'],'promotions',['PK id','UNIQUE promotion_code'])
card(d,b['promotion_products'],'promotion_products',['PK (promotion_id, product_id)','FK promotion_id / product_id'],fill=PINK)
card(d,b['orders'],'orders',['PK id','FK customer_id, employee_id','FK promotion_id (NULL)','customer_request_key'])
card(d,b['order_items'],'order_items',['PK id','FK order_id, product_id','quantity, unit_price'])
card(d,b['attempts'],'payment_transaction_attempts',['PK id','FK payment_id','UNIQUE txn_ref'])
card(d,b['payments'],'payments',['PK id','FK order_id (UNIQUE)','amount, method, status'])
card(d,b['custom_orders'],'custom_orders',['PK id','FK customer_id, employee_id','status, deposit'])
arrow(d,(600,290),(640,290),'1:N'); arrow(d,(900,405),(330,485),'1:N'); arrow(d,(1460,375),(330,485),'1:N'); arrow(d,(1160,595),(1200,595),'1:N'); arrow(d,(900,720),(900,775),'1:1'); arrow(d,(640,860),(600,860),'1:N')
d.text((645,742),'orders.customer_id / employee_id tham chiếu customers / employees (ERD 1)',font=ft(17,True),fill=BLUE)
im.save(FIG/'erd_sales.png',dpi=(300,300))

im,d=base('ERD 3 | Kho và nhập hàng','purchase_orders.employee_id bắt buộc theo nghiệp vụ đã được chủ dự án xác nhận.')
b={'suppliers':(100,300,620,500),'employees':(650,300,1170,500),'purchase_orders':(1200,300,1720,535),'ingredients':(365,650,885,855),'items':(935,650,1455,855)}
card(d,b['suppliers'],'suppliers',['PK id','name, contact fields'])
card(d,b['employees'],'employees',['PK id','FK account_id (UNIQUE)','employee profile'])
card(d,b['purchase_orders'],'purchase_orders',['PK id','FK supplier_id','FK employee_id NOT NULL','status, total'])
card(d,b['ingredients'],'ingredients',['PK id','name, unit','quantity, status'])
card(d,b['items'],'purchase_order_items',['PK id','FK purchase_order_id','FK ingredient_id','quantity, unit_price'])
arrow(d,(620,390),(1200,390),'1:N'); arrow(d,(1170,430),(1200,430),'1:N'); arrow(d,(1460,535),(1250,650),'1:N'); arrow(d,(885,750),(935,750),'1:N')
im.save(FIG/'erd_inventory.png',dpi=(300,300))

# Use case overview
im,d=base('Use Case tổng quát WA Patisserie','Các tác nhân và nhóm chức năng căn cứ route, trang và quyền trong source hiện tại.')
d.rounded_rectangle((420,180,1380,910),radius=22,fill='#FFFDF9',outline=ACC,width=4)
d.text((460,195),'HỆ THỐNG QUẢN LÝ VÀ BÁN HÀNG',font=ft(24,True),fill=INK)
actors=[('Khách hàng','Guest / CUSTOMER'),('Nhân viên','STAFF'),('Quản lý','MANAGER'),('Quản trị viên','ADMIN')]
for i,(name,role) in enumerate(actors):
    y=265+i*165
    d.ellipse((100,y,175,y+75),outline=BLUE,width=4,fill='#EEF2F4'); d.line((137,y+75,137,y+116),fill=BLUE,width=4); d.line((110,y+91,164,y+91),fill=BLUE,width=4); d.line((137,y+116,112,y+150),fill=BLUE,width=4); d.line((137,y+116,162,y+150),fill=BLUE,width=4)
    d.rounded_rectangle((205,y+35,385,y+105),radius=12,fill=CREAM,outline='#D4BFAE',width=2)
    d.text((220,y+43),name,font=ft(20,True),fill=INK); d.text((220,y+72),role,font=ft(16),fill=MUTED)
cases=[(470,260,'Xem danh mục / sản phẩm'),(925,260,'Đăng ký, xác thực, đăng nhập'),(470,405,'Đặt hàng và tra cứu đơn'),(925,405,'Đặt bánh theo yêu cầu'),(470,550,'Bán hàng POS / xử lý đơn'),(925,550,'Quản lý sản phẩm / khuyến mãi'),(470,695,'Nhập kho / nhà cung cấp'),(925,695,'Quản lý tài khoản / vai trò'),(690,815,'Tra cứu nhật ký / báo cáo')]
for x,y,t in cases:
    d.ellipse((x,y,x+390,y+72),fill=WHITE,outline=ACC,width=3); d.text((x+17,y+22),t,font=ft(19,True),fill=INK)
for a,c in [((385,310),(470,295)),((385,310),(925,295)),((385,475),(470,440)),((385,475),(925,440)),((385,640),(470,585)),((385,805),(925,585)),((385,805),(470,730)),((385,805),(925,730)),((385,805),(690,850))]: d.line((*a,*c),fill='#8F7D73',width=3)
im.save(FIG/'usecase.png',dpi=(300,300))

# Order flow
im,d=base('Luồng đặt hàng trực tuyến và thanh toán','Khái quát theo CustomerOrderService và các endpoint thanh toán VNPay trong source.')
steps=[('1','Khách hàng','Giỏ hàng + request key'),('2','Backend','Xác thực, kiểm tra dữ liệu và tồn kho'),('3','MySQL','Tạo order, items, payment trong transaction'),('4','Phương thức','CASH hoặc khởi tạo VNPay Sandbox'),('5','VNPay','Return / IPN; backend kiểm tra kết quả'),('6','Backend','Cập nhật trạng thái và chống đơn trùng'),('7','MongoDB','Ghi lịch sử sau MySQL commit')]
for i,(n,title,desc) in enumerate(steps):
    x=180+(i%2)*760; y=190+(i//2)*200
    d.rounded_rectangle((x,y,x+650,y+125),radius=18,fill=WHITE if i%2==0 else PINK,outline=ACC,width=3)
    d.ellipse((x+18,y+26,x+82,y+90),fill=ACC); d.text((x+39,y+38),n,font=ft(27,True),fill=WHITE)
    d.text((x+105,y+16),title,font=ft(23,True),fill=INK); d.multiline_text((x+105,y+55),textwrap.fill(desc,44),font=ft(18),fill=MUTED,spacing=3)
card(d,(250,835,1550,930),'Lưu ý',['Custom order có phần mô phỏng thanh toán ở frontend; không đồng nhất với giao dịch VNPay thật.'],accent=GREEN,fill=CREAM)
im.save(FIG/'order_flow.png',dpi=(300,300))

# Production architecture
im,d=base('Kiến trúc production','Theo cấu hình dự án và trạng thái deploy do chủ dự án cung cấp; chưa kiểm tra dịch vụ trực tiếp.')
card(d,(95,350,495,575),'Người dùng',['Trình duyệt','HTTPS'],accent=BLUE,fill=CREAM)
card(d,(650,225,1100,465),'Render Static Site',['React 19 / Vite 7','VITE_API_BASE_URL','Fetch + credentials'],accent=ACC,fill=PINK)
card(d,(650,585,1100,825),'Render Web Service',['Spring Boot 4.1.1 / Java 21','Dockerfile (context backend)','PORT từ Render'],accent=GREEN)
card(d,(1260,225,1705,465),'Aiven MySQL',['Dữ liệu nghiệp vụ','JPA / Hibernate','ddl-auto=validate'],accent=BLUE,fill=CREAM)
card(d,(1260,585,1705,825),'MongoDB Atlas',['Activity logs','Order status history'],accent=ACC,fill=PINK)
arrow(d,(495,445),(650,350),'HTTPS'); arrow(d,(875,465),(875,585),'REST API'); arrow(d,(1100,350),(1260,350),'JDBC TLS'); arrow(d,(1100,705),(1260,705),'Mongo URI')
im.save(FIG/'deployment.png',dpi=(300,300))

def rep(old,new):
    for p in doc.paragraphs:
        if old in p.text: p.text=p.text.replace(old,new); return p
    return None
def cell_text(c,txt):
    c.paragraphs[0].text=txt
    for p in list(c.paragraphs[1:]): p._element.getparent().remove(p._element)
def add_image_table(i, paths, captions, note=''):
    c=doc.tables[i].cell(0,0); cell_text(c,'')
    for j,path in enumerate(paths):
        p=c.paragraphs[0] if j==0 else c.add_paragraph(); p.alignment=WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before=Pt(3); p.paragraph_format.space_after=Pt(3)
        p.add_run().add_picture(str(path),width=Inches(6.0))
        cap=c.add_paragraph(captions[j]); cap.style='Caption'; cap.alignment=WD_ALIGN_PARAGRAPH.CENTER
    if note:
        p=c.add_paragraph(note); p.paragraph_format.space_before=Pt(2); p.paragraph_format.space_after=Pt(3)
        for r in p.runs: r.font.size=Pt(9); r.font.italic=True

# Add teacher's review page between the cover and report body.
datep=next((p for p in doc.paragraphs if p.text.strip().startswith('Tháng 10')),None)
if datep:
    el=OxmlElement('w:p'); datep._p.addnext(el); title=Paragraph(el,datep._parent); title.style='Heading 1'; title.paragraph_format.page_break_before=True; title.alignment=WD_ALIGN_PARAGRAPH.CENTER; title.add_run('NHẬN XÉT CỦA GIẢNG VIÊN').bold=True
    anchor=title._p
    for label in ['1. Hình thức và bố cục','2. Nội dung chuyên môn','3. Sản phẩm và kết quả','4. Ưu điểm','5. Hạn chế cần khắc phục','6. Điểm số / Xếp loại']:
        el=OxmlElement('w:p'); anchor.addnext(el); p=Paragraph(el,title._parent); p.add_run(label).bold=True; anchor=el
        for _ in range(1 if label.startswith('6.') else 2):
            el=OxmlElement('w:p'); anchor.addnext(el); blank=Paragraph(el,title._parent); blank.add_run('.................................................................................................................................'); anchor=el
    el=OxmlElement('w:p'); anchor.addnext(el); p=Paragraph(el,title._parent); p.alignment=WD_ALIGN_PARAGRAPH.RIGHT; p.add_run('TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2026\nGiảng viên nhận xét\n\n\n(Ký và ghi rõ họ tên)').bold=True
    el=OxmlElement('w:p'); p._p.addnext(el); Paragraph(el,title._parent).paragraph_format.page_break_before=True

# Opening and factual corrections.
changes={
'Backend được mô tả sử dụng Java 21':'Backend sử dụng Java 21 và Spring Boot 4.1.1, tổ chức theo các package controller, service, repository, entity và DTO. Dữ liệu quan hệ dùng Spring Data JPA/MySQL; Activity Log và Order Status History dùng MongoDB. Frontend dùng React 19, React Router và Vite 7. Source có cấu hình dịch vụ VNPay, Cloudinary, email và Tawk.to; trạng thái hoạt động production phải được kiểm chứng riêng.',
'Báo cáo tập trung vào phân tích yêu cầu':'Báo cáo trình bày yêu cầu, thiết kế, cài đặt, hướng dẫn triển khai và các kịch bản kiểm thử. Kết quả chưa chạy xác nhận được ghi rõ là chưa xác minh; ảnh giao diện thật được để vị trí chèn để nhóm bổ sung.',
'Từ khóa: Java 21, Spring Boot, React, MySQL, MongoDB, POS, VNPay, Idempotency, WA Patisserie.':'Từ khóa: Java 21, Spring Boot, React 19, MySQL, MongoDB, POS, Spring Security, VNPay Sandbox, WA Patisserie.',
'Bảng 4.1. Bảng công nghệ sử dụng':'Bảng 1.1. Công nghệ sử dụng trong hệ thống',
'Bảng 4.2. Bảng chức năng theo tác nhân':'Bảng 3.1. Chức năng theo tác nhân',
'Bảng 4.3. Bảng thiết kế cơ sở dữ liệu':'Bảng 3.2. Các bảng dữ liệu chính',
'Bảng 4.4. Bảng API xử lý trong hệ thống':'Bảng 3.3. Endpoint REST tiêu biểu',
'Bảng 4.5. Bảng kiểm thử các nghiệp vụ chính':'Bảng 5.1. Kịch bản kiểm thử nghiệp vụ',
'Bảng 4.6. Bảng phân công công việc nhóm':'Bảng 6.1. Phân công công việc nhóm',
'Cấu trúc thiết kế cơ sở dữ liệu gồm 16 bảng MySQL và 2 Collection MongoDB':'Thiết kế hiện mô tả 19 bảng MySQL và 2 collection MongoDB; tên bảng và quan hệ được cập nhật theo ERD trong source',
'Căn cứ theo mẫu bảng quy định tại Mục 4.2 của Hướng dẫn viết báo cáo, danh sách chức năng theo từng tác nhân được phân bổ như sau:':'Bảng trạng thái phản ánh các route và component trong source; việc chạy thành công cần được xác nhận bằng kiểm thử và ảnh thật.',
'MongoDB giúp hệ thống lưu trữ hàng triệu bản ghi nhật ký mà không làm ảnh hưởng đến hiệu năng truy vấn của các bảng bán hàng chính trong MySQL.':'MongoDB tách tài liệu log khỏi bảng nghiệp vụ MySQL; hiệu năng cần được đánh giá bằng tải thực tế.',
'Khi khởi động ứng dụng, Flyway tự động rà soát bảng flyway_schema_history và áp dụng các file SQL V1__..., V2__... chưa chạy, loại bỏ hoàn toàn việc phải thao tác thủ công bằng phpMyAdmin hay MySQL Workbench.':'Flyway quản lý các file migration có phiên bản. Trong production hiện tại spring.flyway.enabled=false; schema và baseline phải được kiểm soát riêng trước khi bật migration.',
'Nếu giao dịch MySQL bị Rollback (do lỗi thanh toán, hết hàng), log sẽ không được ghi, đảm bảo tính nhất quán. Nếu MySQL thành công, tác vụ ghi NoSQL chạy ngầm giúp trả kết quả về cho người dùng nhanh chóng.':'Ghi log được gọi sau callback commit; MongoAfterCommitWriter hiện chạy write.run() trực tiếp trong afterCommit, chưa dùng executor bất đồng bộ. Không kết luận độ trễ thấp nếu chưa đo.',
'Bảng 4.5. Bảng kiểm thử các nghiệp vụ chính':'Bảng 5.1. Kịch bản kiểm thử nghiệp vụ',
'Frontend: Sử dụng bộ kiểm thử tự động Node.js Test Runner (node --test) với 42 kịch bản tự động kiểm tra tính toán giỏ hàng, thuật toán chọn voucher giảm giá cao nhất, khôi phục trạng thái idempotency sau khi reload và xác thực số điện thoại.':'Frontend hiện có 10 tệp *.test.js; package.json chưa khai báo script test. Cần chạy bộ test và ghi lại kết quả thật; số tệp không đồng nghĩa số test case.',
'Backend: Sử dụng JUnit 5, Mockito và Spring Security Test để kiểm thử logic tính toán chiết khấu, kiểm tra phân quyền URL và kiểm tra cơ chế khóa giao dịch bi quan.':'Backend có 13 tệp test Java; dependency test được khai báo trong pom.xml. Lần cập nhật tài liệu này chưa chạy test, do đó chưa công bố pass/fail.',
'Tài liệu tham khảo gợi ý (Theo Mục 6)':'TÀI LIỆU THAM KHẢO',
'Tài liệu hướng dẫn cài đặt nhanh: Tệp README.md tại thư mục gốc dự án.':'Tài liệu hiện có: frontend/README.md, backend/CONFIGURATION.md và backend/HELP.md; checkout này chưa có README ở thư mục gốc.',
'Bộ sưu tập API Postman: Cung cấp file WA_Patisserie_API_Collection.json đi kèm đĩa nộp bài.':'Bộ sưu tập Postman: chưa tìm thấy trong source hiện tại; bổ sung nếu nhóm có bản lưu riêng.',
'https://github.com/nhom4/QuanLyTiemBanhNgot (Thay bằng link thực tế của nhóm)':'https://github.com/thanhhoang8123/QuanLyTiemBanhNgot (repository do nhóm cung cấp)',
'Mật khẩu dùng chung cho tất cả các tài khoản là: `Banh@123`.':'Không ghi mật khẩu thật trong báo cáo. Tài khoản nghiệm thu phải dùng mật khẩu riêng, không dùng production và khóa/xóa sau kiểm thử.',
'Đảm bảo MySQL Server đang chạy trên cổng 3306 và đã tạo sẵn schema rỗng: CREATE DATABASE quanlytiembanhngot CHARACTER SET utf8mb4;.':'Local: đặt DB_URL, DB_USERNAME, DB_PASSWORD theo schema development. Không dùng lệnh tạo schema hoặc thao tác trên production trong hướng dẫn này.',
'Đảm bảo MongoDB đang chạy trên cổng 27017.':'Local: đặt MONGODB_URI đến MongoDB development; production dùng Atlas qua biến môi trường, không ghi URI xác thực trong tài liệu.',
'Cơ chế Flyway sẽ tự động quét và chạy toàn bộ các migration để tạo bảng và nạp dữ liệu mẫu khởi đầu.':'Production đang tắt Flyway; ứng dụng cần schema đúng trước khi khởi động. Baseline phải được kiểm soát riêng, không chạy dev-migration trên production.',
'Hệ thống WA Patisserie đã hoàn thành 100% các mục tiêu và yêu cầu đặt ra ban đầu:':'Source hiện có các phân hệ cốt lõi dưới đây; mức nghiệm thu cuối cùng cần xác minh qua kiểm thử và minh chứng vận hành:',
'31 Controller, hơn 20 Entity':'các controller, service, repository và entity theo từng miền nghiệp vụ',
'Bản nguồn ghi 31 Controller, hơn 20 Entity và 42 frontend tests. Chỉ giữ các số liệu này nếu mã nguồn và kết quả chạy kiểm thử xác nhận.':'Không giữ số liệu cũ chưa kiểm chứng. Source hiện có 13 file test Java và 10 file frontend *.test.js; lần cập nhật này chưa chạy test.',
'Bản nguồn nêu “16 bảng MySQL và 2 Collection MongoDB”, trong khi bảng liệt kê cần được đếm và đối chiếu với migration thực tế. Cập nhật số lượng chính xác.':'ERD hiện mô tả 19 bảng MySQL và 2 collection MongoDB; bảng thiết kế đã được bổ sung theo ERD.',
'Bản nguồn ghi tất cả chức năng và test case đều “Đã hoàn thành/ĐẠT”. Cần chạy lại từng luồng, thay kết quả không đạt hoặc chưa kiểm chứng bằng trạng thái trung thực.':'Trạng thái chức năng và kết quả test trong bản cập nhật được ghi là cần xác minh; cập nhật sau khi chạy từng luồng và lưu ảnh minh chứng.',
'Báo cáo được hoàn thiện và đối chiếu chính xác theo đúng Quy định Hướng dẫn viết báo cáo đồ án môn Lập trình Java.':'Nhóm cần đọc soát nội dung, bổ sung ảnh thật, kết quả test và phân công nhiệm vụ trước khi nộp.',
'được lưu phiên':'được tạo qua API backend',
'Spring Boot & Kiến trúc phân tầng':'Spring Boot và kiến trúc phân tầng',
'Toàn bộ các thao tác trừ kho, tích điểm, hoàn tồn khi hủy đơn đều được bao bọc trong Transaction của Spring (@Transactional) với cơ chế khóa bi quan (Pessimistic Locking) để chống tranh chấp dữ liệu (Race Condition).':'Một số service dùng transaction và một số repository có truy vấn khóa bi quan; cần kiểm thử cạnh tranh dữ liệu để kết luận mức kiểm soát race condition.',
'100% câu truy vấn sử dụng JPQL/HQL Parameterized Queries, tuyệt đối không ghép chuỗi SQL thô.':'JPA/repository được dùng cho truy vấn dữ liệu; native query cần được rà soát riêng trước khi khẳng định tất cả truy vấn đều tham số hóa.',
'đảm bảo phản hồi API tạo đơn dưới 100ms.':'chưa có benchmark độ trễ trong source.',
'Nâng cao tuyệt đối, phòng chống hiệu quả 7 cuộc tấn công mạng phổ biến':'các biện pháp session, CSRF, BCrypt và phân quyền đã có cấu hình; chưa có kiểm thử xâm nhập để đánh giá mức chống chịu tổng thể',
'Truy cập tại: https://docs.oracle.com/en/java/javase/21/docs/api/':'Truy cập tại: https://docs.oracle.com/en/java/javase/21/docs/api/ (truy cập ngày 03/11/2026).',
'Truy cập tại: https://docs.spring.io/spring-boot/reference/web/servlet.html':'Truy cập tại: https://docs.spring.io/spring-boot/reference/web/servlet.html (truy cập ngày 03/11/2026).',
'Truy cập tại: https://docs.spring.io/spring-data/jpa/reference/':'Truy cập tại: https://docs.spring.io/spring-data/jpa/reference/ (truy cập ngày 03/11/2026).',
'Truy cập tại: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html':'Truy cập tại: https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html (truy cập ngày 03/11/2026).',
'https://sandbox.vnpayment.vn/apis/docs/':'https://sandbox.vnpayment.vn/apis/docs/ (truy cập ngày 03/11/2026).',
'hoàn thành xuất sắc':'cần nhóm xác nhận'
}
for old,new in changes.items(): rep(old,new)

# Word heading hierarchy and contents field.
for p in doc.paragraphs:
    t=p.text.strip()
    if re.match(r'^\d+\.\d+\.\d+\s',t): p.style='Heading 3'
    elif re.match(r'^\d+\.\d+\s',t): p.style='Heading 2'
    if p.style.name.startswith('Heading'): p.paragraph_format.keep_with_next=True
for p in doc.paragraphs:
    if p.text.strip() in ['DANH MỤC TỪ VIẾT TẮT','KẾT LUẬN, TÀI LIỆU THAM KHẢO VÀ PHỤ LỤC','Kết luận','TÀI LIỆU THAM KHẢO','Phụ lục','PHỤ LỤC A – DANH SÁCH ẢNH CẦN CHỤP TRƯỚC KHI NỘP','PHỤ LỤC B – CÁC ĐIỂM PHẢI ĐỐI CHIẾU LẠI']:
        p.style='Heading 1'
for name in ['Heading 1','Heading 2','Heading 3']:
    s=doc.styles[name]; s.font.name='Times New Roman'; s._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); s.font.color.rgb=RGBColor(74,48,43)
# Convert the instructional TOC into a Word TOC field.
tochead=next((p for p in doc.paragraphs if p.text.strip()=='MỤC LỤC'),None)
toc=Paragraph(tochead._p.getnext(),tochead._parent) if tochead and tochead._p.getnext() is not None else None
if toc:
    for child in list(toc._p):
        if child.tag != qn('w:pPr'): toc._p.remove(child)
    def field_run(char_type=None, instr=None):
        r=OxmlElement('w:r')
        if char_type:
            e=OxmlElement('w:fldChar'); e.set(qn('w:fldCharType'),char_type); r.append(e)
        if instr:
            e=OxmlElement('w:instrText'); e.set(qn('xml:space'),'preserve'); e.text=instr; r.append(e)
        return r
    toc._p.append(field_run('begin')); toc._p.append(field_run(instr=' TOC \\o "1-3" \\h \\z \\u ')); toc._p.append(field_run('separate'))
    r=OxmlElement('w:r'); e=OxmlElement('w:t'); e.text='Cập nhật mục lục trong Word trước khi in.'; r.append(e); toc._p.append(r); toc._p.append(field_run('end'))
upd=doc.settings._element.find(qn('w:updateFields'))
if upd is None: upd=OxmlElement('w:updateFields'); doc.settings._element.append(upd)
upd.set(qn('w:val'),'true')

# Update technology matrix with versions and scope from pom.xml/package.json.
tech=doc.tables[2]
replacements={
'MySQL Server 8.0':'MySQL (production Aiven 8.4.11 theo thông tin dự án)',
'MongoDB Community Server 7.0':'MongoDB local/Atlas; version server cần xác nhận',
'Node.js v20.x':'Node.js/npm theo môi trường, chưa pin trong package.json',
'Spring Security 4.1.1':'Spring Security (version do Spring Boot quản lý)',
'Flyway Migration':'Flyway (plugin Maven 12.4.0; runtime theo dependency)',
'Cổng thanh toán điện tử':'Cổng thanh toán điện tử'
}
for row in tech.rows:
    for c in row.cells:
        for a,b in replacements.items():
            if a in c.text: c.text=c.text.replace(a,b)
    if row.cells[0].text.strip()=='Frontend Framework':
        vals=['Frontend Framework','React 19, React Router 7, Vite 7, Tailwind CSS 4','theo package.json','Xây dựng SPA, định tuyến và giao diện; kiểm thử responsive thực tế trước khi kết luận.']
        for c,v in zip(row.cells,vals): c.text=v
    if row.cells[0].text.strip()=='Công cụ kiểm thử':
        vals=['Công cụ kiểm thử','JUnit / Mockito / Spring Security Test; Node test files','theo pom.xml/source','Source có test Java và *.test.js; kết quả chạy chưa xác minh trong lần cập nhật này.']
        for c,v in zip(row.cells,vals): c.text=v

# Function matrix is backed by source, but not falsely marked as live-tested.
for row in doc.tables[3].rows[1:]: row.cells[3].text='Có thành phần trong source; cần kiểm thử thực tế'

# Full data design: 19 MySQL tables and two MongoDB collections, per ERD.
dbrows=[
('roles','id','accounts.role_id → roles.id','Danh mục quyền.'),('accounts','id','role_id → roles.id; customer_id → customers.id (NULL)','Tài khoản; username/email và token hash có unique.'),('employees','id','account_id → accounts.id (UNIQUE, nullable)','Hồ sơ nhân viên.'),('customers','id','accounts, orders, custom_orders, contact_messages tham chiếu','Hồ sơ khách hàng.'),('contact_messages','id','customer_id → customers.id (NULL; SET NULL)','Tin nhắn liên hệ.'),('newsletter_subscriptions','id','Không có FK; email UNIQUE','Đăng ký nhận tin.'),('categories','id','products.category_id tham chiếu','Danh mục sản phẩm.'),('products','id','category_id → categories.id (NULL)','Sản phẩm và số lượng.'),('promotions','id','promotion_products; orders.promotion_id','Khuyến mãi; promotion_code UNIQUE.'),('promotion_products','promotion_id, product_id','FK tới promotions và products','Bảng many-to-many.'),('orders','id','customer_id, employee_id, promotion_id','Đơn hàng; request key chống trùng.'),('order_items','id','order_id → orders; product_id → products','Chi tiết đơn hàng.'),('payments','id','order_id → orders (UNIQUE, NOT NULL)','Payment one-to-one với Order.'),('payment_transaction_attempts','id','payment_id → payments; txn_ref UNIQUE','Lần thử giao dịch.'),('custom_orders','id','customer_id → customers; employee_id → employees','Yêu cầu đặt bánh riêng.'),('suppliers','id','purchase_orders.supplier_id tham chiếu','Nhà cung cấp.'),('purchase_orders','id','supplier_id; employee_id → employees (NOT NULL theo nghiệp vụ)','Phiếu nhập hàng.'),('purchase_order_items','id','purchase_order_id; ingredient_id','Chi tiết phiếu nhập.'),('ingredients','id','purchase_order_items.ingredient_id tham chiếu','Nguyên liệu.'),('activity_logs (MongoDB)','_id','Document, không có FK MySQL','Nhật ký hoạt động.'),('order_status_history (MongoDB)','_id','Document, không có FK MySQL','Lịch sử trạng thái.')]
tbl=doc.tables[7]
while len(tbl.rows)>1: tbl._tbl.remove(tbl.rows[-1]._tr)
for i,row in enumerate(dbrows):
    cells=tbl.add_row().cells
    for c,v in zip(cells,row): c.text=v
    if i%2:
        for c in cells:
            sh=OxmlElement('w:shd'); sh.set(qn('w:fill'),'F8F1EA'); c._tc.get_or_add_tcPr().append(sh)

# Correct representative API table to actual controller paths/security.
api=[('GET','/api/auth/csrf','Khởi tạo CSRF token','— / JSON csrfToken','Công khai'),('POST','/api/auth/login','Đăng nhập, tạo session','username/password / account','Công khai'),('POST','/api/auth/register','Đăng ký khách hàng','Form JSON / message','Công khai'),('GET','/api/auth/me','Thông tin tài khoản hiện tại','— / AccountResponse','Đã đăng nhập; anonymous 401'),('POST','/api/auth/logout','Hủy session','CSRF headers / message','Đã đăng nhập'),('GET','/api/products','Danh sách sản phẩm','Query / JSON','Công khai'),('GET','/api/categories','Danh mục','— / JSON','Công khai'),('POST','/api/customer/orders','Tạo đơn online','Order request + key / order','CUSTOMER'),('GET','/api/customer/orders','Lịch sử đơn khách','Query / JSON','CUSTOMER'),('POST','/api/customer/payments/vnpay','Tạo yêu cầu thanh toán','Payment request / result','CUSTOMER'),('GET','/api/payments/vnpay/return','VNPay return','Query / điều hướng','Công khai; backend xác minh'),('GET','/api/payments/vnpay/ipn','VNPay IPN','Query / RspCode','Provider; backend xác minh'),('POST','/api/orders','Tạo đơn tại quầy','Order request / Order','STAFF, MANAGER, ADMIN'),('POST','/api/purchase-orders','Tạo phiếu nhập','Supplier + items / result','ADMIN, MANAGER'),('POST','/api/purchase-orders/{id}/receive','Xác nhận nhập kho','Path id / result','ADMIN, MANAGER'),('GET','/api/management/logs/activity','Tra cứu activity log','limit / list','ADMIN, MANAGER'),('POST','/api/shop/contact','Gửi liên hệ','JSON / message','Đã đăng nhập'),('POST','/api/shop/newsletter','Đăng ký nhận tin','email / message','Công khai')]
tb=doc.tables[10]
while len(tb.rows)>1: tb._tbl.remove(tb.rows[-1]._tr)
for row in api:
    for c,v in zip(tb.add_row().cells,row): c.text=v

# Draw diagrams in place of the three empty diagram slots.
add_image_table(4,[FIG/'usecase.png'],['Hình 3.1. Use Case tổng quát WA Patisserie'],'Vai trò và luồng chức năng cần đối chiếu với nghiệp vụ nhóm trước khi nộp.')
add_image_table(5,[FIG/'order_flow.png'],['Hình 3.2. Luồng đặt hàng và thanh toán'],'Luồng đơn online; custom-order payment mockup là luồng riêng.')
add_image_table(6,[FIG/'erd_identity.png',FIG/'erd_sales.png',FIG/'erd_inventory.png'],['Hình 3.3a. ERD tài khoản và khách hàng','Hình 3.3b. ERD danh mục, đơn hàng và thanh toán','Hình 3.3c. ERD kho và nhập hàng'],'Hai document collections MongoDB không có foreign key tới MySQL.')
# All non-diagram image slots remain ready for real web/test screenshots.
slots={8:('Hình 3.4. Storefront trên Render','Chèn ảnh website thật; không dùng mockup.'),9:('Hình 3.5. Minh chứng REST API','Chèn ảnh Postman/DevTools sau kiểm thử; che token/cookie.'),13:('Hình 4.5. Ghi log sau commit','Implementation hiện gọi ghi trực tiếp trong afterCommit, không bất đồng bộ.'),14:('Hình 4.6. VNPay Sandbox','Chỉ chèn ảnh giao dịch Sandbox thực; không chụp thẻ hoặc OTP.'),15:('Hình 4.7. Cloudinary','Chèn kết quả upload đã xác nhận; không lộ API secret.'),16:('Hình 4.8. Tawk.to','Chèn website và inbox thật sau khi xác nhận dịch vụ.'),17:('Hình 4.10. Render services','Chèn trạng thái deploy/health và website thực; che environment.'),21:('Hình 5.1. Kết quả chạy test','Chụp sau khi chạy; hiển thị pass/fail thật.'),23:('Hình 6.1. Giao diện đã nghiệm thu','Chèn ảnh thật của storefront, POS và dashboard.')}
for i,(cap,note) in slots.items():
    c=doc.tables[i].cell(0,0); cell_text(c,'[VỊ TRÍ CHÈN ẢNH THẬT]\n'+cap+'\n'+note)
    for p in c.paragraphs: p.alignment=WD_ALIGN_PARAGRAPH.CENTER

# Architecture image and caption; renumber existing chapter-4 figures.
cap=next((p for p in doc.paragraphs if p.text.strip()=='Hình 4.1. Cấu trúc thư mục dự án'),None)
if cap:
    el=OxmlElement('w:p'); cap._p.addprevious(el); p=Paragraph(el,cap._parent); p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run().add_picture(str(FIG/'deployment.png'),width=Inches(6.0))
    el=OxmlElement('w:p'); cap._p.addprevious(el); p=Paragraph(el,cap._parent); p.style='Caption'; p.alignment=WD_ALIGN_PARAGRAPH.CENTER; p.add_run('Hình 4.1. Kiến trúc triển khai production trên Render, Aiven và MongoDB Atlas')
    cap.text='Hình 4.2. Cấu trúc thư mục dự án'
for p in doc.paragraphs:
    t=p.text.strip()
    if t=='Hình 4.2. Mã nguồn xử lý Idempotency': p.text='Hình 4.3. Mã nguồn xử lý Idempotency'
    if t=='Hình 4.3. Mã nguồn Pessimistic Locking': p.text='Hình 4.4. Mã nguồn Pessimistic Locking'
    if t.startswith('Hình 4.4. Mã nguồn ghi Audit Log'): p.text='Hình 4.5. Ghi audit log sau commit'
    if t.startswith('Hình 4.5. Luồng thanh toán'): p.text='Hình 4.6. Luồng thanh toán VNPay Sandbox'
    if t.startswith('Hình 4.6. Ảnh đã tải'): p.text='Hình 4.7. Lưu trữ ảnh Cloudinary'
    if t.startswith('Hình 4.7. Widget live'): p.text='Hình 4.8. Widget Tawk.to'
    if t.startswith('Hình 4.8. Backend và Frontend'): p.text='Hình 4.10. Deploy trên Render'

# Add a production deployment section before chapter 5.
ch5=next((p for p in doc.paragraphs if p.text.strip().startswith('CHƯƠNG 5')),None)
if ch5:
    entries=[('Heading 2','4.6. Triển khai production trên Render'),('Normal','Frontend được triển khai dạng Static Site; backend là Web Service đóng gói bằng backend/Dockerfile với build context backend. Dockerfile dùng Maven Wrapper và Java 21, sau đó chạy JAR trên JRE 21. server.port nhận PORT do Render cấp và mặc định 8080.'),('Normal','Frontend gọi API qua VITE_API_BASE_URL. Backend chạy profile prod; CORS lấy origin frontend từ cấu hình. Session/CSRF cần được xác nhận sau deploy bằng Network/DevTools; trạng thái Live không thay cho kiểm thử chức năng.'),('Normal','Production hiện cấu hình Hibernate ddl-auto=validate, SQL init mode=never và Flyway disabled. Schema phải sẵn sàng trước khi ứng dụng khởi động; baseline không tự tạo. Chỉ bật Flyway sau khi schema candidate và baseline được người phụ trách database xác nhận.'),('Normal','Các tên biến cần cấu hình theo dịch vụ được dùng: DB_URL, DB_USERNAME, DB_PASSWORD, MONGODB_URI, FRONTEND_URL, VITE_API_BASE_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, SPRING_MAIL_HOST, SPRING_MAIL_PORT, SPRING_MAIL_USERNAME, SPRING_MAIL_PASSWORD, SHOP_CONTACT_EMAIL và VNPAY_*; PORT do Render cung cấp. Không ghi giá trị bí mật trong báo cáo.'),('Normal','Rà soát source cho thấy một số cấu hình còn giá trị credential viết trực tiếp. Trước khi public hoặc tiếp tục deploy, chuyển chúng sang Environment, thu hồi/đổi credential đã xuất hiện trong source; không mặc định VNPay production đã được cấp.')]
    for style,text in reversed(entries):
        el=OxmlElement('w:p'); ch5._p.addprevious(el); p=Paragraph(el,ch5._parent); p.style=style; p.add_run(text)

# Test-result table is explicitly unverified; remove sample passwords from account rows.
for row in doc.tables[20].rows[1:]:
    row.cells[1].text='Tài khoản kiểm thử do nhóm tạo riêng'
    row.cells[3].text='Chỉ dùng local/staging; đặt mật khẩu riêng; không dùng production.'
for p in doc.paragraphs:
    if 'Banh@123' in p.text: p.text=p.text.replace('Banh@123','mật khẩu riêng do nhóm tự đặt')
    if p.text.strip().startswith('test_admin'): p.text=p.text.replace('test_admin','tài khoản ADMIN kiểm thử')
for row in doc.tables[22].rows[1:]: row.cells[4].text='Chưa xác minh trong lần cập nhật báo cáo'

# Correct assignment table to the three actual members listed on the cover; no invented work claims.
team=doc.tables[24]
while len(team.rows)>1: team._tbl.remove(team.rows[-1]._tr)
for name in ['Lê Thanh Hoàng','Trần Thị Thảo Như','Võ Thị Thúy An']:
    cells=team.add_row().cells
    vals=[name,'Phân công chi tiết cần nhóm xác nhận','Minh chứng/sản phẩm theo phân công thực tế','Cần bổ sung']
    for c,v in zip(cells,vals): c.text=v

# References, repository and source documentation.
extra=['8. Spring. Spring Data MongoDB Reference. https://docs.spring.io/spring-data/mongodb/reference/ (truy cập 03/11/2026).','9. MySQL. MySQL 8.4 Reference Manual. https://dev.mysql.com/doc/refman/8.4/en/ (truy cập 03/11/2026).','10. React. React Documentation. https://react.dev/ (truy cập 03/11/2026).','11. Vite. Vite Guide. https://vite.dev/guide/ (truy cập 03/11/2026).','12. Render. Documentation. https://render.com/docs (truy cập 03/11/2026).']
ref=next((p for p in doc.paragraphs if p.text.startswith('7. Flyway by Redgate.')),None)
if ref:
    anchor=ref._p
    for txt in extra:
        el=OxmlElement('w:p'); anchor.addnext(el); p=Paragraph(el,ref._parent); p.add_run(txt); anchor=el
rep('Đường dẫn kho mã nguồn github: https://github.com/nhom4/QuanLyTiemBanhNgot (Thay bằng link thực tế của nhóm)','Đường dẫn kho mã nguồn: https://github.com/thanhhoang8123/QuanLyTiemBanhNgot (theo thông tin nhóm cung cấp).')
rep('Thư mục script CSDL: backend/src/main/resources/db/migration/','ERD: ERD_HeThongQuanLyBanhNgot.md. Migration: backend/src/main/resources/db/migration/. SQL candidate cần review riêng trước khi import production.')
for p in doc.paragraphs:
    t=p.text.strip()
    if t.startswith('Bản nguồn đang dùng tên minh họa'):
        p.text='Tên thành viên/MSSV giữ theo bìa; nhiệm vụ cụ thể cần nhóm xác nhận theo phân công thực tế.'
    if t.startswith('Kiểm tra lại phiên bản Spring Boot'):
        p.text='Các phiên bản đã cập nhật theo pom.xml/package.json; version server MongoDB và runtime Node/npm cần xác nhận trên môi trường thật.'
    if t.startswith('Thay toàn bộ thông tin mẫu trên bìa'):
        p.text='Đối chiếu tên trường, khoa, giảng viên, lớp và học kỳ với biểu mẫu chính thức trước khi nộp.'

# Add fielded report title metadata and save.
doc.core_properties.title='Báo cáo đồ án môn Lập trình Java WA Patisserie'
doc.core_properties.subject='Phân tích, thiết kế, cài đặt, triển khai và kiểm thử hệ thống'
doc.save(OUT)
print('CREATED',OUT)
print('PARAGRAPHS',len(doc.paragraphs),'TABLES',len(doc.tables),'DB_ROWS',len(doc.tables[7].rows),'API_ROWS',len(doc.tables[10].rows),'TEST_ROWS',len(doc.tables[22].rows))
