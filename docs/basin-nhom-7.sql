-- Thay ten_namespace.ten_bang bang bang dich cua Stream do giang vien cung cap.
-- Chi dem ban ghi that cua website Anh Em Shop. Loc truoc DISTINCT de loai su kien thu.
-- time la timestamp sau khi ingest; dau vao gui epoch milliseconds.
SELECT COUNT(DISTINCT json_get_str(meta, 'event_id')) AS luot_xem_24h
FROM ten_namespace.ten_bang
WHERE id = '07'
  AND time >= now() - INTERVAL '24 hours'
  AND json_get_str(meta, 'site') = 'anh-em-shop'
  AND json_get_str(meta, 'event') = 'page_view'
  AND json_get_bool(meta, 'test') = false;
