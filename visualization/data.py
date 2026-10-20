"""Read a selected Iceberg snapshot and prepare group 07 analytics."""
import json
import os
from datetime import datetime, timedelta, timezone

import pandas as pd


def s3_client():
    import boto3
    from botocore.config import Config
    required = ('R2_ACCOUNT_ID', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY')
    if any(not os.getenv(k) for k in required):
        raise ValueError('Thiếu cấu hình R2 trong .env. Điền đủ bốn trường R2 rồi thử lại.')
    return boto3.client('s3', endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'], region_name='auto',
        config=Config(connect_timeout=10, read_timeout=30, retries={'max_attempts': 2}))


def metadata_candidates():
    """Group metadata by table directory; never pick a different table silently."""
    s3 = s3_client()
    groups = {}
    for page in s3.get_paginator('list_objects_v2').paginate(
            Bucket=os.environ['R2_BUCKET'], Prefix=os.getenv('R2_PREFIX', '')):
        for obj in page.get('Contents', []):
            key = obj['Key']
            if not key.endswith('.metadata.json'):
                continue
            directory = key.rsplit('/', 1)[0]
            if directory not in groups or obj['LastModified'] > groups[directory]['LastModified']:
                groups[directory] = obj
    return {directory: obj['Key'] for directory, obj in sorted(groups.items())}


def read_iceberg(key, group='07'):
    from pyiceberg.table import StaticTable
    from pyiceberg.expressions import EqualTo
    endpoint = f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
    table = StaticTable.from_metadata(f"s3://{os.environ['R2_BUCKET']}/{key}", properties={
        's3.endpoint': endpoint, 's3.access-key-id': os.environ['R2_ACCESS_KEY_ID'],
        's3.secret-access-key': os.environ['R2_SECRET_ACCESS_KEY'], 's3.region': 'auto'})
    fields = {field.name for field in table.schema().fields}
    needed = {'id', 'country', 'device', 'time', 'ip'}
    if not needed.issubset(fields):
        raise ValueError('Bảng được chọn không có đủ id, country, device, time, ip.')
    return table.scan(row_filter=EqualTo('id', group),
        selected_fields=tuple(sorted(needed | ({'meta'} & fields)))).to_pandas()


def meta_dict(value):
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            result = json.loads(value)
            return result if isinstance(result, dict) else {}
        except (ValueError, TypeError):
            return {}
    if isinstance(value, list):
        try:
            return dict(value)
        except (TypeError, ValueError):
            pass
    return {}


def prepare_events(df, group='07', now=None):
    df = df.copy()
    if df.empty:
        return pd.DataFrame(columns=['id', 'country', 'device', 'time', 'ip'])
    if pd.api.types.is_numeric_dtype(df['time']):
        df['time'] = pd.to_datetime(df['time'], unit='ms', utc=True, errors='coerce')
    else:
        df['time'] = pd.to_datetime(df['time'], utc=True, errors='coerce')
    now = pd.Timestamp(now or datetime.now(timezone.utc))
    df = df[(df['id'].astype(str) == group) & (df['time'] >= now - timedelta(hours=24)) & (df['time'] <= now)].copy()
    if 'meta' in df:
        meta = df['meta'].map(meta_dict)
        # Legacy records without metadata remain visible, but marked in the UI.
        keep = meta.map(lambda x: x.get('test') not in (True, 'true')
            and x.get('event', 'page_view') == 'page_view'
            and x.get('site', 'anh-em-shop') == 'anh-em-shop')
        df = df[keep].copy()
        df['event_id'] = meta[keep].map(lambda x: x.get('event_id') or None)
        known = df[df['event_id'].notna()].drop_duplicates('event_id')
        df = pd.concat([known, df[df['event_id'].isna()]], ignore_index=True)
    for field in ('country', 'device'):
        df[field] = df[field].fillna('Không rõ').replace('', 'Không rõ')
    return df.sort_values('time', ascending=False)


def sample_events():
    now = datetime.now(timezone.utc)
    return pd.DataFrame([{'id': '07', 'country': ['VN', 'US', 'JP'][i % 3],
        'device': ['ios', 'pc', 'android'][i % 3], 'time': now - timedelta(minutes=i * 15),
        'ip': f'192.0.2.{i % 9 + 1}'} for i in range(48)])
