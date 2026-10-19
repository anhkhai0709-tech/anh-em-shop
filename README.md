# Anh Em Shop

Website độc lập lưu tại D:\AnhEmShop. Bản mẫu chỉ được đọc; không dùng Git, tài khoản, cookie hay database cũ.

## Local

Node 22 trở lên, pnpm. Chạy: pnpm install, pnpm build, pnpm dev.
Máy chủ local tự khởi tạo SQLite riêng ở .local/ và không gọi Workers AI từ xa. Node 22+ cần hỗ trợ node:sqlite.
Kiểm tra API: pnpm test. Test dùng SQLite bộ nhớ, mật khẩu ngẫu nhiên và không chạm D1 thật.

## Cloudflare + GitHub

1. Tạo repository mới cho riêng Anh Em Shop và push mã này.
2. Tạo Pages bằng **Connect to Git**, chọn repo mới, branch main, build command pnpm build, output public. Không tạo Direct Upload trước: không thể chuyển dự án đó sang Git integration.
3. Tạo D1 mới anh-em-shop-db. Thay database_id giữ chỗ trong wrangler.jsonc bằng ID mới. Áp dụng migrations/0001_init.sql vào D1 mới.
4. Bind DB tới D1 mới và AI tới Workers AI, ở production và preview nếu dùng. Không dùng ID database của website mẫu.
5. Chỉ dùng Free plan, không bật Workers Paid. Chat có giới hạn lượt và fallback tìm kiếm catalog khi AI không khả dụng; hạn mức miễn phí do Cloudflare thực thi.
6. Người quản trị đăng ký tài khoản mới trên website rồi nâng role bằng D1 console với câu lệnh UPDATE users SET role='admin' WHERE username='TEN_TAI_KHOAN_DA_XAC_NHAN';. Không có mật khẩu quản trị mặc định.

Không commit .env, .dev.vars, .wrangler, database local hoặc token. Thông tin liên hệ mới cần chủ shop cập nhật trước khi kinh doanh. Danh mục ban đầu là sản phẩm mẫu, không phải khách hàng/đơn hàng cũ.

## Thống kê truy cập
Trang analytics.html dành cho admin. Sự kiện lưu ở D1 analytics_events: trang, nguồn (hostname), thiết bị, trình duyệt, OS, IP từ CF-Connecting-IP, quốc gia/thành phố gần đúng từ request.cf. Không lưu truy vấn tìm kiếm, mật khẩu hay URL referrer đầy đủ. Tự dọn dữ liệu quá 30 ngày khi có sự kiện mới; chỉ truy vấn dữ liệu 30 ngày khi hiển thị. Khách có nút tắt thống kê ở cuối trang.
