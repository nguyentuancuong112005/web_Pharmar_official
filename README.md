# Hệ thống Quản lý Dược phẩm & Nhập/Xuất Kho (Web Pharmar)

Hệ thống quản lý kho thông minh giúp theo dõi lượng dược phẩm tồn kho, quản lý danh mục thuốc, nhà cung cấp, phân quyền nhân viên và tối ưu hóa quy trình nhập kho (Inbound) / xuất kho (Outbound) theo thời gian thực.

---
<img width="1920" height="1080" alt="Screenshot 2026-07-16 221836" src="https://github.com/user-attachments/assets/d768b65d-d2e4-4744-b2e1-750baa3db83d" />


## 📁 Cấu trúc thư mục dự án

```text
WEB_PHARMAR/
├── .github/workflows/
│   └── ci.yml                     # Cấu hình CI/CD Pipeline (GitHub Actions)
├── back_end_managements/          # Mã nguồn Backend (Node.js API)
│   ├── node_modules/              # Thư viện Node.js đã cài đặt
│   ├── server.js                  # File chạy server chính
│   ├── gen-password.js            # Công cụ mã hóa mật khẩu nhân viên
│   ├── package.json               # Cấu hình dự án và dependencies backend
│   ├── package-lock.json          # File khóa phiên bản thư viện
│   ├── test_k6.js                 # Kịch bản kiểm thử hiệu năng (Load Testing) đạt yêu cầu
│   └── test_k6fail.js             # Kịch bản kiểm thử hiệu năng (Kịch bản lỗi/quá tải)
├── font_end_managements/          # Giao diện người dùng (HTML/CSS/JS thuần)
│   ├── auth/                      # Đăng nhập / Đăng xuất hệ thống
│   ├── dashboard/                 # Bảng điều khiển tổng quan (Dashboard)
│   ├── medicine_catalog/          # Quản lý danh mục dược phẩm
│   ├── report_analytics/          # Báo cáo thống kê, phân tích dữ liệu
│   ├── staff_role/                # Quản lý phân quyền tài khoản nhân viên
│   ├── stock_input_output/        # Quản lý quy trình nhập/xuất kho (Inbound/Outbound)
│   ├── suppliers/                 # Quản lý đối tác và nhà cung cấp
│   └── system_setting/            # Cài đặt cấu hình hệ thống
├── Mysql/                         # Thư mục lưu trữ mã nguồn cơ sở dữ liệu
│   ├── bang_inbound.sql           # Cấu trúc cơ sở dữ liệu phiếu nhập kho
│   ├── bang_medicine.sql          # Cấu trúc cơ sở dữ liệu danh mục thuốc
│   ├── bang_outbound.sql          # Cấu trúc cơ sở dữ liệu phiếu xuất kho
│   ├── bang_staff.sql             # Cấu trúc cơ sở dữ liệu thông tin nhân viên
│   └── bang_suppliers.sql         # Cấu trúc cơ sở dữ liệu nhà cung cấp
└── README.md                      # Tài liệu hướng dẫn sử dụng và vận hành dự án

----------------Các lệnh mà nhóm chúng em đưa dự án lên github------------------------
# 1. Khởi tạo một Git Repository trống tại máy cục bộ
git init

# 2. Tạo và chuyển sang nhánh chính tên là "main"
git branch -M main

# 3. Gom toàn bộ các file và thư mục trong dự án vào hàng chờ chuẩn bị lưu
git add .

# 4. Ghi nhận và lưu lại trạng thái phiên bản đầu tiên của mã nguồn
git commit -m "them file pipeline"

# 5. Thiết lập liên kết (Remote) giữa thư mục máy tính với kho chứa trên GitHub
git remote add origin [https://github.com/nguyentuancuong112005/web_Pharmar_official.git](https://github.com/nguyentuancuong112005/web_Pharmar_official.git)

# 6. Đẩy (Push) toàn bộ mã nguồn cục bộ lên nhánh main trên GitHub
git push -u origin main --force
-------------------------Thiết lập Data cho web-----------------------------------
#1 Dự án sử dụng cơ sở dữ liệu MySQL ( tải về)
Database Name: pharmakeep_db
User: root 
Password: 01012005 ( thầy có thể điền mật khẩu thầy tự thiết lập ạ)
# tạo database và bảng
Tạo một Schema mới tên là: pharmakeep_db
# Mở và chạy (Execute) lần lượt 5 file .sql trong thư mục /Mysql của dự án để tạo các bảng tương ứng
# bang_suppliers.sql (Bảng suppliers)
# bang_medicine.sql (Bảng medicines)
# bang_staff.sql (Bảng staff)
# bang_inbound.sql (Các bảng inbound_receipts, inbound_items)
# bang_outbound.sql (Các bảng outbound_receipts, outbound_items)

-------------------- thiết lập server.js để kết nối database với web------------------------------------
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // Tài khoản mặc định 
    password: '01012005',  // Nhập mật khẩu kết nối của thầy vào đây ạ
    database: 'pharmakeep_db'
});
# ở file server.js e đã có phần khai báo database rồi ạ, thầy chỉ cần thay mật khẩu và tên user đúng với database thầy đã tạo là được
-------------------- khởi động server.js----------------------------------------------------------
# 1. Di chuyển Terminal vào thư mục backend
cd back_end_managements

# 2. Cài đặt các thư viện Node.js cần thiết (Express, mysql2, cors,...)
npm install

# 3. Khởi chạy máy chủ API Backend
node server.js

--------------------Khởi động trang web-------------------------------------------
# thầy mở file có đường dẫn WEB_PHARMAR/font_end_managements/auth/index.html
# bấm open with live server
--------------------Kiểm thử hiệu năng (Performance Testing với K6)---------------
** phần này em thêm vào để test hiệu năng của web nên thầy có cũng được không có cũng được ạ, nếu test thì phải tải K6 về mới test được ạ **

# 1. Di chuyển vào thư mục backend chứa các kịch bản test
cd back_end_managements

# 2. Chạy kịch bản tải bình thường 
k6 run test_k6.js

# 3. Chạy kịch bản mô phỏng quá tải để kiểm tra ngưỡng xử lý lỗi
k6 run test_k6fail.js
------------------- cài đặt công cụ mã hóa ----------------------------------
#1. Mã hóa mật khẩu
cd back_end_managements
node gen-password.js

