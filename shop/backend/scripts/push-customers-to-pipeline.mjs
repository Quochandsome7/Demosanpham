// Đẩy bảng customers (D1, dữ liệu demo) lên Cloudflare Pipeline stream. Không gửi password_hash.
// Chạy trong shop/backend:  node scripts/push-customers-to-pipeline.mjs [--dry-run]
import { execSync } from "node:child_process";

const INGEST_URL = "https://f8fb6f6f730b404fb2f273fd789d04df.ingest.cloudflare.com";
const dryRun = process.argv.includes("--dry-run");

const raw = execSync(
  'npx wrangler d1 execute cellphonex-db --remote --json --command="SELECT id, name, email, phone, address, created_at FROM customers ORDER BY id"',
  { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
);
const rows = JSON.parse(raw)[0].results;
console.log(`Đọc được ${rows.length} khách hàng từ D1`);

// Schema stream: id, country, device, time (ms), ip, meta
const events = rows.map((r) => ({
  id: "02", // id mặc định của nhóm; phân biệt khách hàng bằng meta.customer_id
  country: "unknown",
  device: "other",
  time: Date.parse(r.created_at.replace(" ", "T") + "Z"), // created_at của D1 là giờ UTC
  ip: "",
  meta: {
    site: "cellphonex",
    event: "customer_signup",
    customer_id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    address: r.address,
  },
}));

if (dryRun) {
  console.log(JSON.stringify(events.map((e) => ({ ...e, meta: { ...e.meta, name: "…", email: "…", phone: "…", address: "…" } })), null, 2));
  console.log(`(dry-run) Sẽ gửi ${events.length} bản ghi, chưa gửi gì.`);
  process.exit(0);
}

const res = await fetch(INGEST_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(events),
});
const body = await res.text();
if (!res.ok) {
  console.error(`Lỗi: HTTP ${res.status} ${body}`);
  process.exit(1);
}
console.log(`Kết quả: ${body}`);
console.log(`Xong: đã gửi ${events.length} khách hàng lên Pipeline.`);
