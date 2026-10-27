// Đẩy dữ liệu thật từ bảng analytics_events (D1) lên Cloudflare Pipeline stream.
// Chạy trong shop/backend:  node scripts/push-to-pipeline.mjs [--dry-run]
import { execSync } from "node:child_process";

const INGEST_URL = "https://f8fb6f6f730b404fb2f273fd789d04df.ingest.cloudflare.com";
const BATCH = 100;
const dryRun = process.argv.includes("--dry-run");

// 1. Đọc toàn bộ sự kiện từ D1 thật
const raw = execSync(
  'npx wrangler d1 execute cellphonex-db --remote --json --command="SELECT * FROM analytics_events ORDER BY id"',
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);
const rows = JSON.parse(raw)[0].results;
console.log(`Đọc được ${rows.length} sự kiện từ D1`);

// 2. Chuyển sang schema của stream: id, country, device, time (ms), ip, meta
const toDevice = (os) =>
  os === "iOS" ? "ios" : os === "Android" ? "android" : ["Windows", "macOS", "Linux", "ChromeOS"].includes(os) ? "pc" : "other";

const events = rows.map((r) => ({
  id: r.visitor_id || r.ip || String(r.id),
  country: r.country || "unknown",
  device: toDevice(r.os),
  time: Date.parse(r.created_at.replace(" ", "T") + "Z"), // created_at của D1 là giờ UTC
  ip: r.ip || "",
  meta: {
    site: "cellphonex",
    event_id: r.id,
    event: r.event,
    path: r.path,
    referrer: r.referrer,
    device_type: r.device,
    os: r.os,
    browser: r.browser,
    city: r.city,
    user_id: r.user_id,
    product_id: r.product_id,
  },
}));

if (dryRun) {
  console.log(JSON.stringify(events.slice(0, 3), null, 2));
  console.log(`(dry-run) Sẽ gửi ${events.length} sự kiện, chưa gửi gì.`);
  process.exit(0);
}

// 3. Gửi theo lô
let sent = 0;
for (let i = 0; i < events.length; i += BATCH) {
  const chunk = events.slice(i, i + BATCH);
  const res = await fetch(INGEST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chunk),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Lô ${i / BATCH + 1} lỗi: HTTP ${res.status} ${body}`);
    process.exit(1);
  }
  sent += chunk.length;
  console.log(`Lô ${i / BATCH + 1}: ${body}`);
}
console.log(`Xong: đã gửi ${sent} sự kiện lên Pipeline.`);
