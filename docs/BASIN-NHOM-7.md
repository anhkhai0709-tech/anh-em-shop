# Ket noi Stream cua giang vien

Website chi gui page_view moi voi id = 07. Dau vao: id, country, device, time (Date.now(), milliseconds), ip, meta. meta co site, event, event_id, path, os, browser, device_type, referrer va test=false. Khong gui ten, email, mat khau hay noi dung chat.

POST gui mot mang JSON theo tai lieu Cloudflare. Phan hoi accepted/HTTP 2xx chi xac nhan endpoint nhan request, khong chung minh ban ghi da qua schema, pipeline va vao Basin. Kiem tra schema error metrics va bang dich ben giang vien. Khong tu dong retry de tranh dem trung; su kien loi van con o D1, chua co co che gui lai tu dong. Thong ke D1 va Basin co the lech neu gui that bai hoac pipeline dang cho xu ly.

Khong tao tai nguyen Basin/Workers Paid/R2 moi trong tai khoan cua sinh vien. Pipeline va chi phi downstream thuoc cau hinh cua giang vien. Neu stream yeu cau xac thuc, dat BASIN_SEND_TOKEN bang Cloudflare secret; khong dua token vao frontend hoac Git.

Can ten warehouse, namespace, bang va quyen truy van hoac ket qua SQL tu giang vien de xac nhan thong ke 24 gio trong Basin. File SQL di kem la mau, chua chay tren bang cua giang vien. So lieu hien tren dashboard hien van la D1.
