# Đối chiếu yêu cầu bài học của nhóm 07

Kiểm tra lại theo ảnh bảng: Website và SEO marketing, e-commerce, Chatbot AI, Big Data, Business Intelligence.

| Phần | Kết quả đã kiểm tra | Phạm vi và phần còn thiếu |
|---|---|---|
| Website | Pages online; trang chủ, 9 sản phẩm, tìm kiếm, phân loại và trang chi tiết | Thông tin email, số điện thoại cửa hàng chưa được chủ shop cung cấp |
| SEO marketing | Title, description, ngôn ngữ, Open Graph; bổ sung canonical, robots.txt, sitemap; noindex trang riêng | SEO kỹ thuật cơ bản; chưa xác nhận Google lập chỉ mục, chưa có Search Console hoặc chiến dịch marketing |
| E-commerce | Đăng ký, đăng nhập, giỏ, đặt đơn, đơn cá nhân, quản trị sản phẩm, duyệt đơn và kiểm tra phân quyền | Đặt đơn và duyệt thủ công; chưa có cổng thanh toán hoặc kết nối giao hàng |
| Chatbot AI | Đã thử tư vấn online và nhận phản hồi nguồn AI; tra cứu catalog và fallback có kiểm thử | Phụ thuộc hạn mức Workers AI; không tra cứu web trực tiếp |
| Big Data | Website gửi page_view id 07 tới Stream; đọc được dữ liệu nhóm 07 trong bảng Iceberg ở R2 | Dùng Pipeline/Sink của thầy; snapshot có độ trễ, không bảo đảm bằng ngay số D1 |
| Business Intelligence | Streamlit đọc Iceberg thật; thống kê 24 giờ, IP, quốc gia, biểu đồ thiết bị, theo giờ và CSV | Dashboard đang chạy local; chưa triển khai dashboard Python thành dịch vụ online. Chưa có báo cáo doanh thu/phễu bán hàng |

## Kiểm tra đã chạy
- Bốn kiểm thử Node đạt: tài khoản và phân quyền, giá đơn do máy chủ quyết định, quản trị/đơn hàng, chatbot fallback, analytics và schema Stream.
- Hai kiểm thử Python đạt: nhóm 07, khoảng UTC 24 giờ, timestamp mili giây, bỏ dòng thử, sự kiện click, dòng tương lai và trùng event_id.
- Streamlit AppTest đọc R2 thật không có exception; hiển thị 9 lượt xem, 6 IP khác nhau, 1 quốc gia tại lần kiểm tra. Các số thay đổi theo thời gian và snapshot.
- Giao diện online đã thử chatbot AI, trang quản trị và thống kê D1.
- Giao diện local đã kiểm tra khách xem sản phẩm và chỉ cần đăng nhập khi mua.
- HTTP local kiểm tra trang chủ, product, admin, analytics, orders, robots, sitemap và API sản phẩm đều trả 200.
- Build hoàn tất. Local server đã sửa để hỗ trợ URL /admin, /analytics, /orders và /product giống Pages.

## Các địa chỉ để trình bày
- Website: https://anh-em-shop.pages.dev/
- Quản trị: https://anh-em-shop.pages.dev/admin
- Thống kê D1: https://anh-em-shop.pages.dev/analytics
- Dashboard Basin trên máy đang chạy: http://127.0.0.1:8501/
- Website local: http://127.0.0.1:8789/

## Khởi động lại
Website local: mở Terminal tại D:\AnhEmShop, chạy `npm run build` rồi `npm run dev`.
Dashboard Python: xem `visualization/BAO_CAO_HUONG_DAN.md`. Chạy `python -m streamlit run app.py --server.address 127.0.0.1 --server.port 8501` trong môi trường đã cài requirements.
Dashboard cần tệp .env chứa khóa R2 trên máy. .env bị Git bỏ qua; không đưa khóa vào báo cáo, ảnh hoặc repository public.

## Kết luận đối chiếu
Đã có đủ thành phần để trình diễn luồng website → thương mại điện tử/chatbot → Stream/Pipeline → Basin Iceberg → dashboard truy cập. Chưa thể khẳng định đạt toàn bộ tiêu chí chấm điểm khi chưa có đề chi tiết; marketing thực tế, thanh toán online và BI doanh thu chỉ cần bổ sung nếu thầy yêu cầu riêng.
