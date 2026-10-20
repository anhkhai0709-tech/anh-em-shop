# Thống kê truy cập 24 giờ bằng Streamlit và Cloudflare Basin

## Luồng dữ liệu
Website → Stream của giảng viên → Pipeline và Sink → bảng Iceberg trong R2 → Python PyIceberg → Streamlit.
Ứng dụng đọc trực tiếp snapshot Iceberg, không lấy số liệu D1 để thay cho Basin.

## Các tệp
- `app.py`: giao diện, biểu đồ và nút cập nhật.
- `data.py`: kết nối R2, chọn metadata, đọc Iceberg và lọc nhóm 07.
- `.env`: khóa riêng trên máy; không đưa lên GitHub.
- `requirements.txt`: thư viện cần cài.

## Cài và chạy trên Windows
Mở VS Code → File → Open Folder → D:\AnhEmShop. Vào Terminal → New Terminal, chạy:
```powershell
cd D:\AnhEmShop\visualization
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```
Chỉ sao chép tệp mẫu khi chưa có `.env`. Mở `.env` bằng VS Code và điền cấu hình R2 được cấp. Không gửi khóa vào chat.
```powershell
.\.venv\Scripts\python.exe -m streamlit run app.py --server.address 127.0.0.1 --server.port 8501
```
Mở http://localhost:8501. Giữ Terminal chạy; Ctrl+C để tắt. Đây là ứng dụng Python local, không phải một trang tự chạy trên Cloudflare Pages.

## Lấy cấu hình ở đâu
Cloudflare → R2 object storage → Overview: lấy Account ID và chọn đúng bucket đích mà Sink đang ghi.
Người quản lý bucket cấp thông tin S3 Access Key ID và Secret Access Key có quyền đọc đối tượng và liệt kê bucket đó.
Trong bucket, xem thư mục của bảng Iceberg chứa metadata. Có thể nhập `R2_PREFIX` để chỉ tìm trong thư mục bảng.
Giữ `ICEBERG_METADATA_KEY` trống để ứng dụng tìm metadata và cho chọn bảng. Nếu điền key cụ thể, ứng dụng đọc snapshot đó; phải đổi key khi muốn snapshot mới hơn.

## Xem dữ liệu thật
Giữ `USE_SAMPLE=0`. Chọn đúng thư mục metadata ở thanh bên trái, bấm Cập nhật để đọc lại.
Ứng dụng chọn metadata có LastModified mới nhất trong từng thư mục, không sắp xếp tên toàn bucket để chọn bảng ngẫu nhiên.
Đây là cách đọc static snapshot; metadata mới nhất theo thời gian có thể chưa phải snapshot đã commit của catalog. Khi cần đối chiếu chính thức, dùng Basin SQL/catalog của thầy.
Nếu lỗi hoặc chưa có metadata, ứng dụng thông báo và dừng, không tự dùng số liệu giả.

## Ý nghĩa chỉ số
Lọc id chuỗi 07, thời gian UTC từ hiện tại lùi 24 giờ; loại mốc tương lai. Time số được hiểu là mili giây.
Nếu có meta, chỉ giữ site anh-em-shop, page_view, test khác true và bỏ trùng event_id. Dòng cũ thiếu meta vẫn được tính nên cần đối chiếu schema thực tế.
IP khác nhau không tương ứng chính xác số người do NAT/VPN. Lượt xem là số sự kiện trang hợp lệ.
Giao diện không hiển thị IP thô. Dữ liệu được cache 60 giây; nút Cập nhật xóa cache.

## Lỗi thường gặp
- AccessDenied: kiểm tra quyền đọc và ListObjects của khóa đúng bucket.
- Không có metadata: kiểm tra bucket/prefix và Pipeline, Sink phía giảng viên.
- File manifest/data không đọc được: metadata có thể trỏ bucket khác; cần quyền đọc toàn bộ tệp thuộc snapshot.
- Không có dữ liệu nhóm 07: kiểm tra id, độ trễ Pipeline và mốc 24 giờ. Dữ liệu id cũ không tự chuyển thành 07.
- Đã tải một snapshot lớn: bản hiện tại lọc id tại Iceberg nhưng thời gian tại pandas; có thể cần tối ưu pushdown khi dữ liệu tăng.

Tài liệu: https://py.iceberg.apache.org/ ; https://docs.streamlit.io/get-started/installation/command-line
