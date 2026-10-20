import os
from pathlib import Path

import streamlit as st
from dotenv import load_dotenv
from data import metadata_candidates, prepare_events, read_iceberg, sample_events

load_dotenv(Path(__file__).with_name('.env'))
st.set_page_config(page_title='Nhóm 07 · Thống kê 24 giờ', layout='wide')
st.title('Thống kê truy cập trong 24 giờ')
st.caption('Anh Em Shop · Nhóm 07 · Cloudflare Basin và R2 Iceberg')
sample = st.sidebar.toggle('Xem dữ liệu mẫu', value=os.getenv('USE_SAMPLE', '0') == '1')
st.sidebar.caption('Dữ liệu thật là mặc định. Chế độ mẫu chỉ dùng kiểm tra giao diện.')
if st.sidebar.button('Cập nhật dữ liệu'):
    st.cache_data.clear()
    st.rerun()

@st.cache_data(ttl=60, show_spinner=False)
def candidates():
    return metadata_candidates()

@st.cache_data(ttl=60, show_spinner=False)
def events(key):
    return read_iceberg(key)

try:
    if sample:
        st.warning('DỮ LIỆU MẪU — không dùng số liệu này để báo cáo kết quả thực tế.')
        raw = sample_events()
    else:
        fixed = os.getenv('ICEBERG_METADATA_KEY', '').strip()
        if fixed:
            key = fixed
        else:
            with st.spinner('Tìm bảng Iceberg trong R2…'):
                options = candidates()
            if not options:
                st.info('Chưa tìm thấy metadata Iceberg. Kiểm tra bucket, prefix và Pipeline của thầy.')
                st.stop()
            directory = st.sidebar.selectbox('Chọn thư mục metadata của bảng', list(options), index=None,
                placeholder='Chọn đúng bảng nhận sự kiện')
            if directory is None:
                st.info('Chọn bảng ở thanh bên trái để đọc dữ liệu thật.')
                st.stop()
            key = options[directory]
        st.caption(f'Nguồn: s3://{os.getenv("R2_BUCKET")}/{key}')
        st.caption('Ảnh chụp Iceberg từ tệp metadata. Có thể trễ so với catalog; bấm Cập nhật để tìm bản mới.')
        with st.spinner('Đang đọc sự kiện nhóm 07…'):
            raw = events(key)
    df = prepare_events(raw)
except Exception:
    st.error('Không đọc được dữ liệu thật. Kiểm tra .env, quyền List/GetObject của R2 và đường dẫn metadata. Không chuyển sang dữ liệu mẫu tự động.')
    st.caption('Khóa và chi tiết xác thực được giữ phía máy chủ, không hiển thị tại đây.')
    st.stop()

st.caption('Khoảng thời gian tính lùi 24 giờ theo UTC. Dữ liệu lọc id="07"; loại sự kiện thử và trùng event_id khi có metadata.')
a, b, c = st.columns(3)
ips = df['ip'].dropna().astype(str)
a.metric('IP khác nhau', ips[ips.str.strip() != ''].nunique())
b.metric('Quốc gia đã xác định', df.loc[df['country'] != 'Không rõ', 'country'].nunique())
c.metric('Lượt xem trang', len(df))
st.caption('IP khác nhau là ước tính theo mạng, không phải số người chính xác. Bản ghi cũ thiếu meta được tính theo từng dòng.')
if df.empty:
    st.info('Chưa có lượt xem nhóm 07 trong 24 giờ gần nhất ở bảng đã chọn.')
else:
    left, right = st.columns(2)
    with left:
        st.subheader('Theo quốc gia')
        st.bar_chart(df['country'].value_counts().rename('Lượt xem'))
    with right:
        st.subheader('Theo thiết bị và hệ điều hành')
        st.bar_chart(df['device'].value_counts().rename('Lượt xem'))
    st.subheader('Lượt xem theo giờ')
    st.line_chart(df.set_index('time').resample('1h').size().rename('Lượt xem'))
    st.subheader('Sự kiện gần nhất')
    st.dataframe(df[['time', 'country', 'device']].head(200), hide_index=True)
    st.download_button('Tải tổng hợp theo quốc gia CSV',
        df.groupby('country').size().rename('page_views').to_csv().encode('utf-8-sig'),
        'nhom07_quocgia_24h.csv', 'text/csv')
