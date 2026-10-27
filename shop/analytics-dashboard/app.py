"""Báo cáo lượt truy cập website Cellphone X.

Đọc bảng Iceberg do Cloudflare Pipeline (Basin) ghi vào R2, qua S3 API + file metadata.
Chạy: streamlit run app.py
"""

import json
import os
import time

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
BUCKET = os.getenv("R2_BUCKET", "")
ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
# Tiền tố đường dẫn của bảng trong bucket (để trống = lấy metadata mới nhất của cả bucket)
TABLE_PREFIX = os.getenv("ICEBERG_TABLE_PREFIX", "")
USE_SAMPLE = os.getenv("USE_SAMPLE", "0") == "1"
R2_ENDPOINT = f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com"

# Stream dùng chung với nhóm khác. Bản ghi của Cellphone X có meta.site = SITE_ID; bản ghi đẩy
# trước khi có trường site thì nhận diện bằng: không có site, event_id là số nguyên (id dòng D1) + device_type
SITE_ID = os.getenv("SITE_ID", "cellphonex")

VN_TZ = "Asia/Ho_Chi_Minh"
DEVICE_LABELS = {"ios": "iOS", "android": "Android", "pc": "PC", "other": "Khác"}
# Gom các cách ghi thiết bị khác nhau trong stream về ios / android / pc / other
DEVICE_ALIASES = {"windows": "pc", "macos": "pc", "mac": "pc", "desktop": "pc", "linux": "pc", "iphone": "ios", "ipad": "ios"}
EVENT_LABELS = {
    "page_view": "Xem trang",
    "product_view": "Xem sản phẩm",
    "search": "Tìm kiếm",
    "add_to_cart": "Thêm giỏ hàng",
    "begin_checkout": "Bắt đầu đặt hàng",
    "purchase": "Đặt hàng thành công",
}


# ─── Nạp dữ liệu ────────────────────────────────────────────────────────────


def sample_events() -> pd.DataFrame:
    """Dữ liệu mẫu để xem thử giao diện khi chưa có kết nối R2."""
    now_ms = int(time.time() * 1000)
    rows = []
    for i in range(60):
        rows.append({
            "id": f"visitor-{i % 9}",
            "country": ["VN", "VN", "VN", "US", "JP"][i % 5],
            "device": ["pc", "ios", "android"][i % 3],
            "time": now_ms - i * 15 * 60_000,
            "ip": f"10.0.0.{i % 7}",
            "meta": json.dumps({
                "event_id": i,
                "event": ["page_view", "page_view", "product_view", "add_to_cart", "begin_checkout"][i % 5],
                "path": ["/", "/product/1", "/cart", "/checkout"][i % 4],
                "referrer": ["Direct", "google.com", "facebook.com"][i % 3],
                "browser": ["Chrome", "Safari", "Edge"][i % 3],
                "city": ["Thái Nguyên", "Hà Nội", "Haiphong"][i % 3],
            }),
        })
    return pd.DataFrame(rows)


def latest_metadata_key(s3) -> str:
    """File *.metadata.json mới nhất (theo thời gian ghi) của bảng."""
    objs = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix=TABLE_PREFIX):
        objs += [o for o in page.get("Contents", []) if o["Key"].endswith(".metadata.json")]
    if not objs:
        raise RuntimeError(f"Không tìm thấy file *.metadata.json trong bucket '{BUCKET}' (prefix '{TABLE_PREFIX}').")
    return max(objs, key=lambda o: o["LastModified"])["Key"]


def iceberg_events() -> pd.DataFrame:
    import boto3
    from pyiceberg.table import StaticTable

    s3 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=ACCESS_KEY_ID,
        aws_secret_access_key=SECRET_ACCESS_KEY,
        region_name="auto",
    )
    table = StaticTable.from_metadata(
        f"s3://{BUCKET}/{latest_metadata_key(s3)}",
        properties={
            "s3.endpoint": R2_ENDPOINT,
            "s3.access-key-id": ACCESS_KEY_ID,
            "s3.secret-access-key": SECRET_ACCESS_KEY,
            "s3.region": "auto",
        },
    )
    return table.scan().to_pandas()


def parse_meta(value) -> dict:
    if isinstance(value, dict):
        return value
    if isinstance(value, (str, bytes)) and value:
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except ValueError:
            return {}
    return {}


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # time: số millisecond hoặc kiểu timestamp → giờ Việt Nam
    if pd.api.types.is_numeric_dtype(df["time"]):
        df["time"] = pd.to_datetime(df["time"], unit="ms", utc=True)
    else:
        df["time"] = pd.to_datetime(df["time"], utc=True)
    df["time"] = df["time"].dt.tz_convert(VN_TZ)

    # Tách các trường trong meta ra cột riêng
    metas = df.get("meta", pd.Series([None] * len(df), index=df.index)).map(parse_meta)
    df["is_ours"] = metas.map(
        lambda m: m.get("site") == SITE_ID
        or ("site" not in m and isinstance(m.get("event_id"), int) and "device_type" in m)
    )
    df["is_test"] = metas.map(lambda m: bool(m.get("test") or m.get("is_test")) or "test" in str(m.get("event", "")))
    meta = pd.json_normalize(metas.tolist())
    meta.index = df.index
    for col in ["event_id", "event", "path", "referrer", "browser", "os", "city", "device_type", "product_id"]:
        df[col] = meta[col] if col in meta else None

    df["event"] = df["event"].fillna("page_view")
    dev = df["device"].fillna("").str.lower().str.strip()
    df["device"] = dev.map(lambda d: DEVICE_ALIASES.get(d, d if d in DEVICE_LABELS else "other"))
    df["is_test"] |= dev.eq("test") | df["id"].astype(str).str.lower().str.startswith("test")
    for col in ["country", "device", "city", "browser", "referrer", "path"]:
        df[col] = df[col].fillna("Không rõ").replace("", "Không rõ")

    # Bỏ bản ghi trùng khi cùng một sự kiện (cùng event_id) bị đẩy lên nhiều lần
    key = df["event_id"].astype(str) + "|" + df["id"].astype(str)
    has_id = df["event_id"].notna()
    df = pd.concat([df[has_id & ~key.duplicated(keep="last")], df[~has_id]])
    return df.sort_values("time")


@st.cache_data(ttl=300, show_spinner="Đang đọc dữ liệu từ Cloudflare R2…")
def load_events(use_sample: bool) -> pd.DataFrame:
    return normalize(sample_events() if use_sample else iceberg_events())


# ─── Giao diện ──────────────────────────────────────────────────────────────


def count_table(df: pd.DataFrame, col: str, labels: dict | None = None) -> pd.DataFrame:
    out = (
        df.groupby(col)
        .agg(nguoi=("id", "nunique"), luot=("id", "size"))
        .sort_values("nguoi", ascending=False)
        .rename(columns={"nguoi": "Người truy cập", "luot": "Sự kiện"})
    )
    if labels:
        out.index = out.index.map(lambda k: labels.get(k, k))
    out.index.name = None
    return out


st.set_page_config(page_title="Truy cập Cellphone X", page_icon="📊", layout="wide")
st.title("Báo cáo lượt truy cập website Cellphone X")
st.caption("Nguồn: Cloudflare Pipeline (Basin) → bảng Iceberg trên R2 · cập nhật mỗi 5 phút · giờ Việt Nam")

with st.sidebar:
    st.header("Bộ lọc")
    range_label = st.radio("Khoảng thời gian", ["24 giờ qua", "7 ngày qua", "30 ngày qua", "Tất cả"])
    scope = st.radio(
        "Phạm vi dữ liệu",
        ["Website Cellphone X", "Toàn bộ stream (gồm nhóm khác)"],
        help="Stream ingest đang dùng chung với các nhóm khác.",
    )
    hide_test = st.checkbox("Ẩn bản ghi thử nghiệm và thời gian lỗi", value=True)
    use_sample = st.toggle("Dùng dữ liệu mẫu", value=USE_SAMPLE)
    if st.button("Tải lại dữ liệu"):
        load_events.clear()

if not use_sample and not all([ACCOUNT_ID, BUCKET, ACCESS_KEY_ID, SECRET_ACCESS_KEY]):
    st.error("Thiếu tham số kết nối trong analytics-dashboard/.env (R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY).")
    st.stop()

try:
    all_df = load_events(use_sample)
except Exception as e:  # noqa: BLE001 — hiển thị lỗi kết nối cho người dùng
    st.error(f"Không đọc được bảng Iceberg: {e}")
    st.stop()

if use_sample:
    st.info("Đang hiển thị dữ liệu mẫu.")

hours = {"24 giờ qua": 24, "7 ngày qua": 24 * 7, "30 ngày qua": 24 * 30}.get(range_label)
df = all_df
if scope == "Website Cellphone X" and not use_sample:
    # Chỉ giữ sự kiện truy cập; bỏ các bản ghi khác của site (vd. customer_signup)
    df = df[df["is_ours"] & df["event"].isin(EVENT_LABELS.keys())]
if hide_test:
    df = df[~df["is_test"] & (df["time"].dt.year >= 2020)]
if hours:
    df = df[df["time"] >= pd.Timestamp.now(tz=VN_TZ) - pd.Timedelta(hours=hours)]

if df.empty:
    st.warning(f"Không có lượt truy cập nào trong {range_label.lower()}. Tổng số bản ghi trong bảng: {len(all_df)}.")
    st.stop()

# Chỉ số tổng quan
c1, c2, c3, c4 = st.columns(4)
c1.metric("Người truy cập", df["id"].nunique(), help="Số mã người truy cập (visitor_id) khác nhau")
c2.metric("Lượt xem trang", int((df["event"] == "page_view").sum()))
c3.metric("Số IP khác nhau", df["ip"].nunique())
c4.metric("Số quốc gia", df["country"].nunique())

# Theo thời gian
st.subheader("Người truy cập theo thời gian")
freq = "h" if (hours or 0) <= 24 and hours else "D"
trend = df.set_index("time").groupby(pd.Grouper(freq=freq))["id"].nunique().rename("Người truy cập")
st.bar_chart(trend)

# Quốc gia & thiết bị
left, right = st.columns(2)
with left:
    st.subheader("Theo quốc gia")
    t = count_table(df, "country")
    st.bar_chart(t["Người truy cập"], horizontal=True)
    st.dataframe(t, width="stretch")
with right:
    st.subheader("Theo thiết bị")
    t = count_table(df, "device", DEVICE_LABELS)
    st.bar_chart(t["Người truy cập"], horizontal=True)
    st.dataframe(t, width="stretch")

# Hành vi
st.subheader("Hành vi khách hàng")
events = df["event"].value_counts().reindex(EVENT_LABELS.keys(), fill_value=0)
cols = st.columns(len(EVENT_LABELS))
for col, (key, label) in zip(cols, EVENT_LABELS.items()):
    col.metric(label, int(events[key]))

# Chi tiết khác
a, b, c = st.columns(3)
with a:
    st.subheader("Thành phố")
    st.dataframe(count_table(df, "city"), width="stretch")
with b:
    st.subheader("Trình duyệt")
    st.dataframe(count_table(df, "browser"), width="stretch")
with c:
    st.subheader("Nguồn truy cập")
    st.dataframe(count_table(df, "referrer"), width="stretch")

st.subheader("Trang được xem nhiều nhất")
pages = df[df["event"] == "page_view"]["path"].value_counts().head(10).rename("Lượt xem")
st.bar_chart(pages, horizontal=True)

with st.expander(f"Dữ liệu chi tiết ({len(df)} bản ghi)"):
    show = df[["time", "event", "path", "country", "city", "device", "browser", "referrer", "ip", "id"]].copy()
    show["event"] = show["event"].map(lambda k: EVENT_LABELS.get(k, k))
    st.dataframe(show.sort_values("time", ascending=False), width="stretch", hide_index=True)

st.caption(
    "Vị trí suy ra từ IP nên chỉ gần đúng. Người truy cập được đếm theo mã ẩn danh trong trình duyệt; "
    "một người dùng nhiều trình duyệt sẽ được tính nhiều lần."
)
