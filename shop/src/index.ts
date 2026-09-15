import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";

// ============================================================
// DATA
// ============================================================

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  description: string;
  category: string;
  rating: number;
  reviews: number;
  badge?: string;
  chip: string;
  specs: string[];
}

const products: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    price: 28990000,
    originalPrice: 34990000,
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80",
    description:
      "iPhone 15 Pro Max với chip A17 Pro mạnh mẽ nhất chế tác trên tiến trình 3nm, camera chính 48MP zoom quang học 5x, khung titan chuẩn hàng không vũ trụ siêu bền nhẹ, màn hình Super Retina XDR 6.7 inch ProMotion 120Hz. Hỗ trợ cổng USB-C tốc độ cao và nút Action Button tiện lợi.",
    category: "Điện thoại",
    rating: 4.9,
    reviews: 2847,
    badge: "Bán chạy",
    chip: "⚡ A17 Pro 3nm",
    specs: ["Camera 48MP 5X", "Khung Titan vũ trụ", "ProMotion 120Hz"],
  },
  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra",
    price: 25990000,
    originalPrice: 31990000,
    image:
      "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80",
    description:
      "Samsung Galaxy S24 Ultra trang bị chip Snapdragon 8 Gen 3 for Galaxy, quyền năng Galaxy AI vượt trội, camera 200MP tái hiện chi tiết sắc nét ngay cả trong bóng tối, bút S-Pen quyền năng tích hợp bên trong thân máy titan sang trọng, màn hình Dynamic AMOLED 2X 6.8 inch 2600 nits.",
    category: "Điện thoại",
    rating: 4.8,
    reviews: 1923,
    badge: "Galaxy AI",
    chip: "🚀 Snapdragon 8 Gen 3",
    specs: ["Camera 200MP AI", "Bút S-Pen tích hợp", "Màn 2600 nits"],
  },
  {
    id: 3,
    name: "MacBook Air M3",
    price: 27490000,
    originalPrice: 32490000,
    image:
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80",
    description:
      "MacBook Air M3 siêu mỏng nhẹ chỉ 1.24kg, đột phá với chip Apple M3 8-core CPU / 10-core GPU, hỗ trợ dò tia tốc độ cao bằng phần cứng và Neural Engine 16 lõi xử lý AI thông minh. Màn hình Liquid Retina 13.6 inch 500 nits và thời lượng pin huyền thoại lên tới 18 giờ.",
    category: "Laptop",
    rating: 4.7,
    reviews: 1456,
    badge: "Mới nhất",
    chip: "✨ Apple M3 Chip",
    specs: ["Pin bền 18 giờ", "Retina 13.6 inch", "Chỉ nặng 1.24kg"],
  },
  {
    id: 4,
    name: "iPad Pro M4",
    price: 23990000,
    originalPrice: 28990000,
    image:
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80",
    description:
      "iPad Pro M4 là thiết bị Apple mỏng nhất từ trước đến nay, trang bị màn hình công nghệ đột phá Ultra Retina XDR Tandem OLED siêu sáng 1600 nits peak HDR, chip Apple M4 thế hệ mới cho sức mạnh đồ họa đỉnh cao, kết hợp hoàn hảo cùng Apple Pencil Pro và Magic Keyboard.",
    category: "Tablet",
    rating: 4.8,
    reviews: 987,
    badge: "Siêu mỏng",
    chip: "🔮 Apple M4 OLED",
    specs: ["Tandem OLED HDR", "Dày chỉ 5.1mm", "Apple Pencil Pro"],
  },
  {
    id: 5,
    name: "AirPods Pro 2",
    price: 5690000,
    originalPrice: 6790000,
    image:
      "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&auto=format&fit=crop&q=80",
    description:
      "AirPods Pro 2 thế hệ mới với chip H2 xử lý âm thanh thời gian thực, khử tiếng ồn chủ động ANC gấp 2 lần, chế độ Thích ứng Adaptive Audio và Nhận biết cuộc trò chuyện thông minh. Hộp sạc chuẩn USB-C có loa định vị Precision Finding chống thất lạc.",
    category: "Phụ kiện",
    rating: 4.6,
    reviews: 3241,
    badge: "Âm thanh Pro",
    chip: "🎧 Apple H2 Audio",
    specs: ["Chống ồn ANC 2X", "Adaptive Sound", "Cổng USB-C"],
  },
  {
    id: 6,
    name: "Apple Watch Ultra 2",
    price: 18990000,
    originalPrice: 21990000,
    image:
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
    description:
      "Apple Watch Ultra 2 chế tác từ vỏ Titan 49mm chuẩn quân đội, màn hình sáng rực rỡ 3000 nits rõ nét dưới nắng gắt, chip SiP S9 mạnh mẽ hỗ trợ cử chỉ chạm hai lần Double Tap kỳ diệu. GPS băng tần kép L1/L5 chuẩn xác tuyệt đối, lặn sâu 40m và pin lên tới 72 giờ ở chế độ tiết kiệm.",
    category: "Đồng hồ",
    rating: 4.9,
    reviews: 876,
    badge: "Đỉnh cao",
    chip: "🧭 Dual-GPS L1/L5",
    specs: ["Vỏ Titan 49mm", "Màn hình 3000 nits", "Pin tới 72 giờ"],
  },
];

// ============================================================
// ICONS (Clean, Modern, Futuristic SVG)
// ============================================================

const Icons = {
  logo: `<svg class="logo-svg" viewBox="0 0 28 28" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="22" height="22" rx="7" stroke="currentColor"/><rect x="8" y="5" width="12" height="18" rx="3" stroke="currentColor" stroke-width="1.6"/><path d="M11 11.5L17 17.5M17 11.5L11 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="14" cy="7.5" r="0.8" fill="currentColor"/></svg>`,
  home: `<svg class="nav-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  cart: `<svg class="nav-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
  mapPin: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  phone: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mail: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  globe: `<svg class="contact-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  eye: `<svg class="action-svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  heart: `<svg class="heart-svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  heartFilled: `<svg class="heart-svg filled" viewBox="0 0 24 24" width="18" height="18" fill="#ef4444" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  fire: `<svg class="section-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff6b35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  truck: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-3-4h-5v10"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`,
  shield: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>`,
  refresh: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  check: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  help: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`,
  tag: `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r=".5" fill="currentColor"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  box: `<svg class="feat-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
};

// ============================================================
// HELPERS
// ============================================================

function formatVND(n: number): string {
  return n.toLocaleString("vi-VN") + "đ";
}

function discount(original: number, current: number): number {
  return Math.round(((original - current) / original) * 100);
}

function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

interface CartItem {
  id: number;
  qty: number;
}

function getCart(raw: string | undefined): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return [];
}

function cartCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}

// ============================================================
// CSS
// ============================================================

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --primary:#ff6b35;
  --primary-dark:#e55a2b;
  --primary-light:#ff8c61;
  --primary-glow:rgba(255,107,53,.28);
  --cyan:#00f2fe;
  --cyan-dark:#0284c7;
  --cyan-glow:rgba(0,242,254,.35);
  --bg:#f8fafc;
  --card:#ffffff;
  --text:#0f172a;
  --text-secondary:#64748b;
  --border:#e2e8f0;
  --success:#10b981;
  --shadow:0 10px 30px -10px rgba(15,23,42,.08);
  --shadow-hover:0 25px 50px -12px rgba(255,107,53,.25);
  --radius:18px;
  --transition:all .3s cubic-bezier(.4,0,.2,1);
}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}

/* === HEADER === */
header{
  background:linear-gradient(135deg,#ff6b35 0%,#ff8c61 50%,#ff512f 100%);
  background-size:200% 200%;
  animation:gradientShift 8s ease infinite;
  color:#fff;padding:0 32px;height:70px;
  display:flex;align-items:center;justify-content:space-between;
  position:sticky;top:0;z-index:100;
  box-shadow:0 4px 30px rgba(255,107,53,.35);
  backdrop-filter:blur(12px);
}
@keyframes gradientShift{
  0%,100%{background-position:0% 50%}
  50%{background-position:100% 50%}
}
.logo{font-size:1.55rem;font-weight:900;letter-spacing:-.5px;display:flex;align-items:center;gap:12px}
.logo-badge{
  width:40px;height:40px;border-radius:12px;
  background:rgba(255,255,255,.2);
  border:1px solid rgba(255,255,255,.35);
  display:flex;align-items:center;justify-content:center;
  color:#fff;box-shadow:0 4px 15px rgba(0,0,0,.12);
  transition:transform .3s cubic-bezier(.34,1.56,.64,1);
}
.logo:hover .logo-badge{transform:rotate(-6deg) scale(1.08)}
.logo-x{
  background:linear-gradient(135deg,#ffffff 0%,#ffe4d6 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  font-style:normal;
  font-weight:900;
}
nav{display:flex;align-items:center;gap:10px}
.nav-link{
  color:#fff;font-weight:700;font-size:.9rem;
  padding:8px 18px;border-radius:12px;
  transition:var(--transition);display:inline-flex;
  align-items:center;gap:8px;
}
.nav-link:hover{background:rgba(255,255,255,.22);transform:translateY(-1px)}
.cart-link{
  background:rgba(255,255,255,.18);border-radius:14px;
  display:inline-flex;align-items:center;gap:8px;
  padding:8px 18px;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);
  font-weight:700;font-size:.9rem;color:#fff;
  transition:var(--transition);
}
.cart-link:hover{background:rgba(255,255,255,.26);transform:translateY(-1px)}
.badge{
  background:#fff;color:var(--primary);
  font-size:.72rem;font-weight:900;
  min-width:22px;height:22px;
  display:inline-flex;align-items:center;justify-content:center;
  border-radius:11px;
  animation:badgePop .4s cubic-bezier(.68,-.55,.27,1.55);
}
@keyframes badgePop{
  0%{transform:scale(0)}
  100%{transform:scale(1)}
}

/* === TECH TICKER MARQUEE === */
.tech-ticker-wrap{
  background:#090d16;
  border-bottom:1px solid rgba(255,107,53,.3);
  color:#fff;
  overflow:hidden;
  white-space:nowrap;
  padding:10px 0;
  font-size:.8rem;
  font-weight:700;
  letter-spacing:.8px;
  position:relative;
  z-index:20;
}
.tech-ticker{
  display:inline-flex;
  gap:40px;
  animation:tickerScroll 26s linear infinite;
}
.tech-ticker:hover{animation-play-state:paused}
@keyframes tickerScroll{
  0%{transform:translateX(0)}
  100%{transform:translateX(-50%)}
}
.ticker-item{
  display:inline-flex;
  align-items:center;
  gap:10px;
  color:#e2e8f0;
}
.ticker-dot{
  width:6px;height:6px;
  background:var(--primary);
  border-radius:50%;
  box-shadow:0 0 10px var(--primary);
}

/* === HERO SECTION TECH CANVAS === */
.hero{
  background:radial-gradient(ellipse at 50% 20%,#1e1b4b 0%,#0f172a 60%,#020617 100%);
  color:#fff;padding:90px 32px 80px;text-align:center;
  position:relative;overflow:hidden;
}
#tech-canvas{
  position:absolute;top:0;left:0;
  width:100%;height:100%;
  pointer-events:auto;z-index:1;
}
.hero-grid-overlay{
  position:absolute;inset:0;
  background-image:
    linear-gradient(rgba(255,107,53,.07) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,107,53,.07) 1px,transparent 1px);
  background-size:38px 38px;
  mask-image:radial-gradient(ellipse at 50% 50%,black 40%,transparent 80%);
  -webkit-mask-image:radial-gradient(ellipse at 50% 50%,black 40%,transparent 80%);
  pointer-events:none;z-index:2;
}
.hero-content{
  position:relative;z-index:3;
  max-width:760px;margin:0 auto;
  pointer-events:none;
}
.hero-content *{pointer-events:auto}
.hero-pill-badge{
  display:inline-flex;align-items:center;gap:10px;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(0,242,254,.35);
  color:#38bdf8;padding:7px 18px;border-radius:30px;
  font-size:.8rem;font-weight:800;letter-spacing:1px;
  text-transform:uppercase;margin-bottom:20px;
  backdrop-filter:blur(12px);
  box-shadow:0 0 25px rgba(56,189,248,.25);
  animation:heroSlideUp .6s ease-out;
}
.pulse-cyan{
  width:8px;height:8px;border-radius:50%;
  background:#38bdf8;box-shadow:0 0 10px #38bdf8;
  animation:radarPulse 1.8s infinite;
}
@keyframes radarPulse{
  0%{transform:scale(.9);box-shadow:0 0 0 0 rgba(56,189,248,.8)}
  70%{transform:scale(1.1);box-shadow:0 0 0 10px rgba(56,189,248,0)}
  100%{transform:scale(.9);box-shadow:0 0 0 0 rgba(56,189,248,0)}
}
.hero h1{
  font-size:clamp(2.2rem,5.5vw,3.6rem);font-weight:900;
  margin-bottom:16px;letter-spacing:-1.2px;line-height:1.2;
  animation:heroSlideUp .8s ease-out;
}
.gradient-text{
  background:linear-gradient(135deg,#ff8c61 0%,#ff6b35 45%,#00f2fe 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  background-clip:text;
}
.hero p{
  font-size:1.15rem;color:rgba(255,255,255,.75);
  margin-bottom:32px;line-height:1.7;
  animation:heroSlideUp .8s ease-out .15s both;
}
.hero-stats{
  display:flex;justify-content:center;gap:45px;
  animation:heroSlideUp .8s ease-out .3s both;
}
.hero-stat{
  text-align:center;
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);
  padding:14px 24px;border-radius:14px;
  backdrop-filter:blur(8px);
  transition:var(--transition);
}
.hero-stat:hover{
  background:rgba(255,255,255,.1);
  transform:translateY(-3px);
  border-color:rgba(255,107,53,.5);
}
.hero-stat-num{font-size:1.9rem;font-weight:900;color:var(--primary-light)}
.hero-stat-label{font-size:.78rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;font-weight:700}
@keyframes heroSlideUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}

/* === MAIN === */
main{max-width:1200px;margin:0 auto;padding:40px 20px}
.section-header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:28px;
}
.section-header h2{font-size:1.5rem;font-weight:700;display:flex;align-items:center;gap:10px}
.section-header h2 span{font-size:1.3rem}

/* === CATEGORIES === */
.categories{
  display:flex;gap:10px;flex-wrap:wrap;margin-bottom:32px;
  animation:fadeInUp .6s ease-out;
}
.cat-tag{
  padding:8px 20px;border-radius:25px;font-size:.85rem;font-weight:600;
  background:var(--card);border:2px solid var(--border);
  cursor:pointer;transition:var(--transition);
  white-space:nowrap;
}
.cat-tag:hover,.cat-tag.active{
  background:var(--primary);color:#fff;border-color:var(--primary);
  transform:translateY(-2px);box-shadow:0 4px 15px var(--primary-glow);
}

/* Card filter animation */
.card.filter-hide{
  opacity:0;transform:scale(.85);
  pointer-events:none;position:absolute;visibility:hidden;
  transition:opacity .3s ease,transform .3s ease;
}
.card.filter-show{
  opacity:1;transform:scale(1) translateY(0) !important;
  position:relative;visibility:visible;
  animation:filterPop .4s cubic-bezier(.4,0,.2,1) both;
}
@keyframes filterPop{
  0%{opacity:0;transform:scale(.85) translateY(20px)}
  100%{opacity:1;transform:scale(1) translateY(0)}
}

/* === GRID & CARDS === */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:28px}
.card{
  background:var(--card);border-radius:var(--radius);overflow:hidden;
  box-shadow:var(--shadow);border:1px solid rgba(226,232,240,.9);
  transition:transform .18s cubic-bezier(.2,0,.2,1),box-shadow .3s ease,border-color .3s ease;
  opacity:0;transform:translateY(40px);
  position:relative;transform-style:preserve-3d;
}
.card.visible{
  opacity:1;transform:translateY(0);
}
.card::after{
  content:'';position:absolute;inset:0;
  border-radius:var(--radius);
  background:radial-gradient(350px circle at var(--mouse-x,50%) var(--mouse-y,50%),rgba(255,107,53,.14),transparent 75%);
  opacity:0;transition:opacity .3s ease;
  pointer-events:none;z-index:4;
}
.card:hover::after{opacity:1}
.card:hover{
  border-color:rgba(255,107,53,.45);
  box-shadow:0 20px 45px -10px rgba(255,107,53,.22),0 0 25px rgba(255,107,53,.08);
}
.card-img-wrap{
  position:relative;overflow:hidden;height:270px;
  background:radial-gradient(circle at 50% 50%,#f8fafc,#e2e8f0);
}
.card-img-wrap img{
  width:100%;height:100%;object-fit:cover;
  transition:transform .7s cubic-bezier(.2,0,.2,1),filter .4s ease;
}
.card:hover .card-img-wrap img{transform:scale(1.08)}
.card-badge{
  position:absolute;top:14px;left:14px;
  background:linear-gradient(135deg,#ff6b35,#ff8c61);color:#fff;
  padding:5px 14px;border-radius:8px;
  font-size:.75rem;font-weight:800;
  text-transform:uppercase;letter-spacing:.5px;
  animation:badgeSlide .5s ease-out;
  box-shadow:0 4px 15px var(--primary-glow);
  z-index:3;
}
@keyframes badgeSlide{
  from{opacity:0;transform:translateX(-20px)}
  to{opacity:1;transform:translateX(0)}
}
.card-discount{
  position:absolute;top:14px;right:14px;
  background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;
  padding:5px 10px;border-radius:8px;
  font-size:.75rem;font-weight:800;
  box-shadow:0 4px 12px rgba(239,68,68,.3);
  z-index:3;
}
.card-wishlist{
  position:absolute;bottom:14px;right:14px;
  width:40px;height:40px;border-radius:50%;
  background:rgba(255,255,255,.95);backdrop-filter:blur(6px);
  display:flex;align-items:center;justify-content:center;
  font-size:1.2rem;cursor:pointer;
  transition:var(--transition);
  opacity:0;transform:scale(.8);
  border:1px solid rgba(0,0,0,.06);
  z-index:5;
}
.card:hover .card-wishlist{opacity:1;transform:scale(1)}
.card-wishlist:hover{background:var(--primary);color:#fff;transform:scale(1.15) !important}
.card-body{padding:22px}
.card-meta{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:8px;
}
.card-category{
  font-size:.75rem;font-weight:700;color:var(--primary);
  text-transform:uppercase;letter-spacing:1px;
}
.card-chip-tag{
  font-size:.72rem;font-weight:800;
  padding:3px 9px;border-radius:6px;
  background:rgba(255,107,53,.1);color:var(--primary-dark);
  border:1px solid rgba(255,107,53,.25);
  display:inline-flex;align-items:center;gap:4px;
}
.card-body h3{font-size:1.1rem;font-weight:800;margin-bottom:8px;line-height:1.35}
.card-body h3 a{transition:color .2s}
.card-body h3 a:hover{color:var(--primary)}
.card-specs{
  display:flex;flex-wrap:wrap;gap:6px;
  margin:8px 0 12px;
}
.spec-tag{
  font-size:.72rem;font-weight:600;
  background:#f1f5f9;color:#475569;
  padding:3px 9px;border-radius:6px;
  display:inline-flex;align-items:center;gap:5px;
}
.spec-dot{
  width:4px;height:4px;border-radius:50%;
  background:var(--primary);display:inline-block;
}
.card-stock{
  font-size:.75rem;font-weight:700;
  color:#059669;display:flex;align-items:center;
  gap:7px;margin-bottom:12px;
}
.pulse-beacon{
  width:7px;height:7px;border-radius:50%;
  background:#10b981;box-shadow:0 0 0 0 rgba(16,185,129,.7);
  animation:pulseGreen 2s infinite;display:inline-block;
}
@keyframes pulseGreen{
  0%{box-shadow:0 0 0 0 rgba(16,185,129,.8)}
  70%{box-shadow:0 0 0 7px rgba(16,185,129,0)}
  100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}
}
.card-rating{display:flex;align-items:center;gap:6px;margin-bottom:12px;font-size:.85rem}
.card-rating .stars{color:#fbbf24;font-size:.9rem}
.card-rating .score{font-weight:700;color:var(--text)}
.card-rating .count{color:var(--text-secondary);font-size:.8rem}
.card-prices{display:flex;align-items:baseline;gap:10px;margin-bottom:18px}
.card-price{color:var(--primary);font-weight:900;font-size:1.25rem}
.card-original{color:var(--text-secondary);font-size:.85rem;text-decoration:line-through}
.card-actions{display:flex;gap:10px}

/* === BUTTONS === */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  background:var(--primary);color:#fff;border:none;
  padding:12px 24px;border-radius:12px;
  font-size:.9rem;font-weight:700;cursor:pointer;
  transition:var(--transition);position:relative;
  overflow:hidden;flex:1;
}
.btn::after{
  content:'';position:absolute;
  width:100%;height:100%;top:0;left:0;
  background:radial-gradient(circle,rgba(255,255,255,.35) 10%,transparent 10.01%);
  transform:scale(10);opacity:0;
  transition:transform .5s,opacity 1s;
}
.btn:active::after{transform:scale(0);opacity:.3;transition:0s}
.btn:hover{
  background:var(--primary-dark);
  transform:translateY(-2px);
  box-shadow:0 8px 25px var(--primary-glow);
}
.btn-cyber{
  background:linear-gradient(135deg,#ff6b35 0%,#ff8c61 100%);
  box-shadow:0 6px 20px rgba(255,107,53,.35);
  position:relative;overflow:hidden;
}
.btn-cyber::before{
  content:'';position:absolute;
  top:0;left:-100%;width:60%;height:100%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
  transform:skewX(-20deg);transition:.6s;
}
.btn-cyber:hover::before{left:150%}
.btn-cyber:hover{
  transform:translateY(-2px) scale(1.02);
  box-shadow:0 10px 30px rgba(255,107,53,.45);
}
.btn-outline{
  background:transparent;color:var(--primary);
  border:2px solid var(--primary);
}
.btn-outline:hover{background:var(--primary);color:#fff}
.btn-sm{padding:8px 16px;font-size:.8rem;border-radius:8px}
.btn-icon{
  width:44px;height:44px;padding:0;flex:none;
  border-radius:12px;font-size:1.05rem;
}
.btn-ghost{
  background:#f8fafc;color:var(--text-secondary);
  border:2px solid var(--border);
}
.btn-ghost:hover{border-color:var(--primary);color:var(--primary);background:#fff}

/* === DETAIL PAGE TECH STYLING === */
.detail-tech-badge-row{
  display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;
}
.detail-chip-pill{
  font-size:.78rem;font-weight:800;padding:4px 14px;border-radius:20px;
  background:rgba(56,189,248,.12);color:#0284c7;
  border:1px solid rgba(56,189,248,.35);
  display:inline-flex;align-items:center;gap:6px;
}
.stock-pulse-detail{
  font-size:.8rem;font-weight:700;color:#059669;
  display:inline-flex;align-items:center;gap:6px;
}
.detail-specs-highlight{
  display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;
  margin:18px 0 22px;padding:16px;
  background:#f8fafc;border-radius:14px;
  border:1px dashed var(--border);
}
.detail-spec-item{
  display:flex;align-items:center;gap:8px;
  font-size:.85rem;font-weight:700;color:var(--text);
}
.detail-spec-item .spec-icon{color:var(--primary)}

/* === DETAIL === */
.breadcrumb{
  display:flex;align-items:center;gap:8px;
  font-size:.85rem;color:var(--text-secondary);
  margin-bottom:24px;
  animation:fadeInUp .5s ease-out;
}
.breadcrumb a:hover{color:var(--primary)}
.breadcrumb .sep{opacity:.4}
.detail{
  display:grid;grid-template-columns:1fr 1fr;gap:48px;
  background:var(--card);border-radius:var(--radius);
  padding:40px;box-shadow:var(--shadow);
  animation:fadeInUp .6s ease-out;
}
.detail-gallery{position:relative;border-radius:12px;overflow:hidden}
.detail-gallery img{
  width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px;
  transition:transform .5s ease;
}
.detail-gallery:hover img{transform:scale(1.03)}
.detail-info{display:flex;flex-direction:column}
.detail-badge{
  display:inline-flex;align-items:center;gap:4px;
  background:var(--primary);color:#fff;
  padding:4px 12px;border-radius:6px;
  font-size:.75rem;font-weight:700;
  width:fit-content;margin-bottom:12px;
}
.detail-info h1{font-size:1.8rem;font-weight:800;line-height:1.3;margin-bottom:10px}
.detail-rating{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:.9rem}
.detail-rating .stars{color:#fbbf24;font-size:1rem}
.detail-rating .count{color:var(--text-secondary)}
.detail-prices{
  display:flex;align-items:baseline;gap:12px;
  margin-bottom:8px;
  padding:16px 0;border-bottom:1px solid var(--border);
}
.detail-price{color:var(--primary);font-weight:800;font-size:2rem}
.detail-original{color:var(--text-secondary);font-size:1.1rem;text-decoration:line-through}
.detail-save{
  background:linear-gradient(135deg,#fef3c7,#fde68a);
  color:#92400e;padding:4px 10px;border-radius:6px;
  font-size:.8rem;font-weight:700;
}
.detail-desc{
  color:var(--text-secondary);line-height:1.8;
  margin:20px 0;font-size:.95rem;flex:1;
}
.detail-features{
  display:grid;grid-template-columns:1fr 1fr;gap:10px;
  margin-bottom:24px;
}
.detail-feature{
  display:flex;align-items:center;gap:8px;
  font-size:.85rem;color:var(--text-secondary);
}
.detail-feature .icon{
  width:32px;height:32px;border-radius:8px;
  background:var(--bg);display:flex;align-items:center;
  justify-content:center;font-size:.9rem;
}
.detail-actions{display:flex;gap:12px;margin-top:auto}

/* === CART === */
.cart-container{animation:fadeInUp .6s ease-out}
.cart-layout{display:grid;grid-template-columns:1fr 380px;gap:32px;align-items:start}
.cart-items{
  background:var(--card);border-radius:var(--radius);
  box-shadow:var(--shadow);overflow:hidden;
}
.cart-item{
  display:flex;align-items:center;gap:20px;
  padding:20px 24px;border-bottom:1px solid var(--border);
  transition:var(--transition);
  animation:cartItemSlide .4s ease-out both;
}
.cart-item:hover{background:#fafbfc}
@keyframes cartItemSlide{
  from{opacity:0;transform:translateX(-20px)}
  to{opacity:1;transform:translateX(0)}
}
.cart-item:nth-child(2){animation-delay:.1s}
.cart-item:nth-child(3){animation-delay:.2s}
.cart-item:nth-child(4){animation-delay:.3s}
.cart-item:nth-child(5){animation-delay:.4s}
.cart-item:nth-child(6){animation-delay:.5s}
.cart-item-img{
  width:80px;height:80px;border-radius:12px;
  object-fit:cover;flex-shrink:0;
}
.cart-item-info{flex:1;min-width:0}
.cart-item-name{font-weight:700;font-size:.95rem;margin-bottom:4px}
.cart-item-price{color:var(--primary);font-weight:600;font-size:.9rem}
.cart-item-qty{
  display:flex;align-items:center;gap:0;
  border:2px solid var(--border);border-radius:10px;overflow:hidden;
}
.cart-item-qty button{
  width:36px;height:36px;border:none;
  background:var(--bg);cursor:pointer;
  font-size:1rem;font-weight:700;
  transition:var(--transition);
  display:flex;align-items:center;justify-content:center;
}
.cart-item-qty button:hover{background:var(--primary);color:#fff}
.cart-item-qty span{
  width:40px;text-align:center;font-weight:700;
  font-size:.9rem;
}
.cart-item-subtotal{
  font-weight:700;font-size:1rem;
  min-width:130px;text-align:right;
}
.cart-item-remove{
  width:36px;height:36px;border-radius:8px;
  border:none;background:transparent;
  color:#ef4444;cursor:pointer;font-size:1.1rem;
  transition:var(--transition);
  display:flex;align-items:center;justify-content:center;
}
.cart-item-remove:hover{background:#fef2f2;transform:scale(1.1)}

/* Cart Summary */
.cart-summary{
  background:var(--card);border-radius:var(--radius);
  box-shadow:var(--shadow);padding:28px;
  position:sticky;top:90px;
  animation:fadeInUp .6s ease-out .2s both;
}
.cart-summary h3{font-size:1.1rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px}
.summary-row{
  display:flex;justify-content:space-between;
  padding:10px 0;font-size:.9rem;color:var(--text-secondary);
}
.summary-row.total{
  border-top:2px solid var(--border);
  margin-top:10px;padding-top:16px;
  font-size:1.15rem;font-weight:800;
  color:var(--text);
}
.summary-row.total .val{color:var(--primary)}
.summary-row.save{color:var(--success);font-weight:600}
.cart-checkout{width:100%;margin-top:20px;padding:16px;font-size:1rem;border-radius:14px}
.cart-continue{
  width:100%;margin-top:10px;padding:14px;font-size:.9rem;
  text-align:center;display:block;
}

/* === EMPTY === */
.empty{
  text-align:center;padding:80px 20px;
  animation:fadeInUp .6s ease-out;
}
.empty-icon{
  font-size:4rem;margin-bottom:16px;
  animation:emptyBounce 2s ease-in-out infinite;
}
@keyframes emptyBounce{
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-10px)}
}
.empty h3{font-size:1.3rem;font-weight:700;margin-bottom:8px}
.empty p{color:var(--text-secondary);margin-bottom:24px}

/* === SUPPORT PAGES === */
.page-hero{
  text-align:center;padding:40px 20px 30px;
  animation:fadeInUp .5s ease-out;
}
.page-hero-icon-box{
  width:72px;height:72px;border-radius:22px;
  background:rgba(255,107,53,.12);
  border:1px solid rgba(255,107,53,.3);
  color:var(--primary);
  display:inline-flex;align-items:center;justify-content:center;
  margin-bottom:16px;box-shadow:0 10px 25px var(--primary-glow);
  animation:heroFloat 3s ease-in-out infinite;
}
.page-hero-icon-box svg{width:36px;height:36px}
.page-hero h1{font-size:1.8rem;font-weight:900}
.page-body{max-width:800px;margin:0 auto}
.page-section{
  background:var(--card);border-radius:var(--radius);
  padding:28px 32px;margin-bottom:20px;
  box-shadow:var(--shadow);
  animation:fadeInUp .5s ease-out both;
}
.page-section h3{
  font-size:1.1rem;font-weight:700;margin-bottom:14px;
  color:var(--text);padding-bottom:10px;
  border-bottom:2px solid var(--bg);
}
.page-content{color:var(--text-secondary);line-height:1.8;font-size:.92rem}
.page-content ul,.page-content ol{padding-left:20px;margin:8px 0}
.page-content li{padding:5px 0}
.page-content li strong{color:var(--text)}
.page-content p{margin:6px 0}
.policy-table{
  width:100%;border-collapse:collapse;margin:8px 0;
  border-radius:10px;overflow:hidden;
}
.policy-table th{
  background:var(--primary);color:#fff;
  padding:12px 16px;font-weight:600;font-size:.85rem;
  text-align:left;
}
.policy-table td{
  padding:11px 16px;border-bottom:1px solid var(--border);
  font-size:.88rem;
}
.policy-table tr:last-child td{border-bottom:none}
.policy-table tr:hover td{background:var(--bg)}

/* === TOAST === */
.toast{
  position:fixed;bottom:30px;right:30px;z-index:1000;
  background:linear-gradient(135deg,#1a1a2e,#16213e);
  color:#fff;padding:16px 24px;border-radius:14px;
  box-shadow:0 10px 40px rgba(0,0,0,.25);
  display:flex;align-items:center;gap:12px;
  animation:toastSlide .5s cubic-bezier(.68,-.55,.27,1.55),toastFade .5s ease 3s forwards;
  max-width:400px;
}
@keyframes toastSlide{
  from{opacity:0;transform:translateY(30px) scale(.9)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes toastFade{
  to{opacity:0;transform:translateY(10px);pointer-events:none}
}
.toast-icon{font-size:1.5rem}
.toast-msg{font-size:.9rem;font-weight:500}
.toast-msg strong{display:block;font-size:.8rem;color:var(--primary-light);margin-top:2px}

/* === FOOTER === */
footer{
  background:#1a1a2e;color:rgba(255,255,255,.7);
  padding:60px 32px 30px;margin-top:60px;
}
.footer-grid{
  max-width:1200px;margin:0 auto;
  display:grid;grid-template-columns:2fr 1fr 1fr 1.5fr;gap:40px;
  margin-bottom:40px;
}
.footer-brand .logo{color:#fff;margin-bottom:14px;font-size:1.45rem}
.footer-brand p{font-size:.85rem;line-height:1.7;color:rgba(255,255,255,.5)}
.footer-col h4{font-weight:800;margin-bottom:18px;color:#fff;font-size:.88rem;text-transform:uppercase;letter-spacing:1.2px}
.footer-col a{display:block;padding:6px 0;font-size:.85rem;transition:color .2s}
.footer-col a:hover{color:var(--primary-light)}
.footer-link{
  display:flex !important;align-items:center;gap:12px;
  padding:7px 0 !important;font-size:.88rem;
  color:rgba(255,255,255,.75);transition:all .25s ease;
  text-decoration:none;
}
.footer-link:hover{color:#fff !important;transform:translateX(4px)}
.footer-link:hover .footer-icon-box{
  background:var(--primary);color:#fff;
  border-color:var(--primary);
  box-shadow:0 0 14px var(--primary-glow);
  transform:scale(1.06);
}
.footer-icon-box{
  width:32px;height:32px;border-radius:9px;
  background:rgba(255,107,53,.12);
  border:1px solid rgba(255,107,53,.28);
  color:var(--primary-light);
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .25s ease;
}
.footer-text{flex:1;word-break:break-all;line-height:1.4}
.footer-bottom{
  max-width:1200px;margin:0 auto;
  border-top:1px solid rgba(255,255,255,.1);
  padding-top:24px;text-align:center;
  font-size:.8rem;color:rgba(255,255,255,.4);
}

/* === ANIMATIONS === */
@keyframes fadeInUp{
  from{opacity:0;transform:translateY(30px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes fadeIn{
  from{opacity:0}
  to{opacity:1}
}
@keyframes slideInLeft{
  from{opacity:0;transform:translateX(-30px)}
  to{opacity:1;transform:translateX(0)}
}
@keyframes scaleIn{
  from{opacity:0;transform:scale(.9)}
  to{opacity:1;transform:scale(1)}
}
@keyframes shimmer{
  0%{background-position:-400px 0}
  100%{background-position:400px 0}
}
.animate-fadeInUp{animation:fadeInUp .6s ease-out both}
.delay-1{animation-delay:.1s}
.delay-2{animation-delay:.2s}
.delay-3{animation-delay:.3s}

/* === RESPONSIVE === */
@media(max-width:900px){
  .detail{grid-template-columns:1fr;gap:28px;padding:24px}
  .cart-layout{grid-template-columns:1fr}
  .footer-grid{grid-template-columns:1fr 1fr;gap:24px}
  .hero-stats{gap:24px}
}
@media(max-width:600px){
  header{padding:0 16px;height:60px}
  .logo{font-size:1.3rem}
  .grid{grid-template-columns:1fr;gap:20px}
  .hero{padding:50px 20px}
  .hero h1{font-size:1.8rem}
  .hero-stats{flex-direction:column;gap:12px}
  .footer-grid{grid-template-columns:1fr}
  .cart-item{flex-wrap:wrap}
  .cart-item-subtotal{min-width:auto}
  .detail-actions{flex-direction:column}
}
`;

// ============================================================
// SCRIPTS
// ============================================================

const SCRIPTS = `
<script>
// Intersection Observer for card animations
document.addEventListener('DOMContentLoaded',()=>{
  const cards=document.querySelectorAll('.card');
  if(cards.length){
    const obs=new IntersectionObserver((entries)=>{
      entries.forEach((e,i)=>{
        if(e.isIntersecting){
          setTimeout(()=>e.target.classList.add('visible'),i*100);
          obs.unobserve(e.target);
        }
      });
    },{threshold:0.1,rootMargin:'50px'});
    cards.forEach(c=>obs.observe(c));
  }

  // Wishlist heart toggle
  document.querySelectorAll('.card-wishlist').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.preventDefault();
      btn.textContent=btn.textContent==='♡'?'♥':'♡';
      btn.style.color=btn.textContent==='♥'?'#ef4444':'';
    });
  });

  // Category filter
  const catTags=document.querySelectorAll('.cat-tag');
  const allCards=document.querySelectorAll('.card[data-category]');
  function filterByCategory(cat){
    let delay=0;
    allCards.forEach(card=>{
      const match=cat==='Tất cả'||card.dataset.category===cat;
      if(!match){
        card.classList.remove('filter-show','visible');
        card.classList.add('filter-hide');
      } else {
        setTimeout(()=>{
          card.classList.remove('filter-hide');
          card.classList.add('filter-show','visible');
        },delay);
        delay+=80;
      }
    });
  }
  catTags.forEach(tag=>{
    tag.addEventListener('click',()=>{
      catTags.forEach(t=>t.classList.remove('active'));
      tag.classList.add('active');
      filterByCategory(tag.textContent.trim());
    });
  });

  // Auto-filter from URL ?cat= param (footer links)
  const urlCat=new URLSearchParams(location.search).get('cat');
  if(urlCat && catTags.length){
    catTags.forEach(t=>{
      t.classList.remove('active');
      if(t.textContent.trim()===urlCat) t.classList.add('active');
    });
    setTimeout(()=>filterByCategory(urlCat),400);
    // Scroll to products
    const grid=document.querySelector('.grid');
    if(grid) setTimeout(()=>grid.scrollIntoView({behavior:'smooth',block:'start'}),500);
  }

  // Smooth number counting for hero stats
  document.querySelectorAll('.hero-stat-num[data-count]').forEach(el=>{
    const target=parseInt(el.dataset.count);
    const suffix=el.dataset.suffix||'';
    let current=0;
    const step=Math.ceil(target/40);
    const timer=setInterval(()=>{
      current+=step;
      if(current>=target){current=target;clearInterval(timer)}
      el.textContent=current.toLocaleString('vi-VN')+suffix;
    },30);
  });

  // Interactive 3D Tilt & Dynamic Spotlight on Cards
  const tiltCards=document.querySelectorAll('.card');
  tiltCards.forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const rect=card.getBoundingClientRect();
      const x=e.clientX-rect.left;
      const y=e.clientY-rect.top;
      card.style.setProperty('--mouse-x',x+'px');
      card.style.setProperty('--mouse-y',y+'px');
      const centerX=rect.width/2;
      const centerY=rect.height/2;
      const rotateX=((y-centerY)/centerY)*-6;
      const rotateY=((x-centerX)/centerX)*6;
      card.style.transform=\`perspective(1000px) rotateX(\${rotateX}deg) rotateY(\${rotateY}deg) translateY(-6px) scale3d(1.02,1.02,1.02)\`;
    });
    card.addEventListener('mouseleave',()=>{
      card.style.transform='';
    });
  });

  // Cyber Particle Network Canvas
  const canvas=document.getElementById('tech-canvas');
  if(canvas){
    const ctx=canvas.getContext('2d');
    let w,h,particles=[];
    const mouse={x:null,y:null,radius:120};
    function resize(){
      w=canvas.width=canvas.parentElement.offsetWidth;
      h=canvas.height=canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize',resize);
    canvas.parentElement.addEventListener('mousemove',e=>{
      const rect=canvas.getBoundingClientRect();
      mouse.x=e.clientX-rect.left;
      mouse.y=e.clientY-rect.top;
    });
    canvas.parentElement.addEventListener('mouseleave',()=>{
      mouse.x=null;mouse.y=null;
    });
    const count=Math.min(Math.floor((w*h)/14000),45);
    for(let i=0;i<count;i++){
      particles.push({
        x:Math.random()*w,
        y:Math.random()*h,
        vx:(Math.random()-.5)*.7,
        vy:(Math.random()-.5)*.7,
        size:Math.random()*2+1,
        color:Math.random()>.4?'rgba(255,107,53,':'rgba(0,242,254,'
      });
    }
    function draw(){
      ctx.clearRect(0,0,w,h);
      for(let i=0;i<particles.length;i++){
        const p=particles[i];
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0||p.x>w)p.vx*=-1;
        if(p.y<0||p.y>h)p.vy*=-1;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=p.color+'.75)';
        ctx.fill();
        for(let j=i+1;j<particles.length;j++){
          const p2=particles[j];
          const dx=p.x-p2.x;
          const dy=p.y-p2.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<90){
            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(p2.x,p2.y);
            ctx.strokeStyle=\`rgba(255,107,53,\${0.2*(1-dist/90)})\`;
            ctx.lineWidth=.7;
            ctx.stroke();
          }
        }
        if(mouse.x!==null){
          const dx=p.x-mouse.x;
          const dy=p.y-mouse.y;
          const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<mouse.radius){
            ctx.beginPath();
            ctx.moveTo(p.x,p.y);
            ctx.lineTo(mouse.x,mouse.y);
            ctx.strokeStyle=\`rgba(0,242,254,\${0.35*(1-dist/mouse.radius)})\`;
            ctx.lineWidth=1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  // Toast auto-dismiss
  const toast=document.querySelector('.toast');
  if(toast) setTimeout(()=>toast.remove(),3500);
});
</script>
`;

// ============================================================
// LAYOUT
// ============================================================

function tickerBanner(): string {
  return `
  <div class="tech-ticker-wrap">
    <div class="tech-ticker">
      <span class="ticker-item"><span class="ticker-dot"></span>⚡ CELLPHONE X FUTURE TECH</span>
      <span class="ticker-item"><span class="ticker-dot"></span>🚀 GIAO HỎA TỐC 2H TOÀN QUỐC</span>
      <span class="ticker-item"><span class="ticker-dot"></span>🛡️ 100% CHÍNH HÃNG APPLE & SAMSUNG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>💎 BẢO HÀNH VIP 1 ĐỔI 1 TRONG 12 THÁNG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>💳 TRẢ GÓP 0% LÃI SUẤT</span>
      <span class="ticker-item"><span class="ticker-dot"></span>🎁 BỘ QUÀ TẶNG CÔNG NGHỆ X-PRO</span>
      <span class="ticker-item"><span class="ticker-dot"></span>⚡ CELLPHONE X FUTURE TECH</span>
      <span class="ticker-item"><span class="ticker-dot"></span>🚀 GIAO HỎA TỐC 2H TOÀN QUỐC</span>
      <span class="ticker-item"><span class="ticker-dot"></span>🛡️ 100% CHÍNH HÃNG APPLE & SAMSUNG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>💎 BẢO HÀNH VIP 1 ĐỔI 1 TRONG 12 THÁNG</span>
      <span class="ticker-item"><span class="ticker-dot"></span>💳 TRẢ GÓP 0% LÃI SUẤT</span>
      <span class="ticker-item"><span class="ticker-dot"></span>🎁 BỘ QUÀ TẶNG CÔNG NGHỆ X-PRO</span>
    </div>
  </div>`;
}

function layout(
  title: string,
  body: string,
  cart: CartItem[],
  opts?: { noHero?: boolean; toast?: string },
): string {
  const count = cartCount(cart);
  const toastHtml = opts?.toast
    ? `<div class="toast"><span class="toast-icon">✅</span><div class="toast-msg">Đã thêm vào giỏ hàng!<strong>${opts.toast}</strong></div></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${title} — Cellphone X</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
<header>
  <a href="/" class="logo">
    <span class="logo-badge">${Icons.logo}</span>
    <span>Cellphone <span class="logo-x">X</span></span>
  </a>
  <nav>
    <a href="/" class="nav-link">${Icons.home} <span>Trang chủ</span></a>
    <a href="/cart" class="cart-link">${Icons.cart} <span>Giỏ hàng</span>${count > 0 ? ` <span class="badge">${count}</span>` : ""}</a>
  </nav>
</header>
${tickerBanner()}
${body}
${toastHtml}
${SCRIPTS}
</body>
</html>`;
}

// ============================================================
// PAGES
// ============================================================

function heroSection(): string {
  return `
  <section class="hero">
    <canvas id="tech-canvas"></canvas>
    <div class="hero-grid-overlay"></div>
    <div class="hero-content">
      <div class="hero-pill-badge"><span class="pulse-cyan"></span> THẾ HỆ CÔNG NGHỆ 2026 MỚI NHẤT</div>
      <h1>Công nghệ đỉnh cao<br><span class="gradient-text">Kiến tạo tương lai</span></h1>
      <p>Khám phá siêu phẩm công nghệ chính hãng với hiệu năng đột phá, camera chuẩn cinema và AI thông minh thế hệ mới.</p>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-num" data-count="10000" data-suffix="+">0</div>
          <div class="hero-stat-label">Khách hàng</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-num" data-count="500" data-suffix="+">0</div>
          <div class="hero-stat-label">Sản phẩm</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-num" data-count="99" data-suffix="%">0</div>
          <div class="hero-stat-label">Hài lòng</div>
        </div>
      </div>
    </div>
  </section>`;
}

function footerSection(): string {
  return `
  <footer>
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo">
          <span class="logo-badge">${Icons.logo}</span>
          <span>Cellphone <span class="logo-x">X</span></span>
        </div>
        <p>Hệ thống bán lẻ thiết bị công nghệ đỉnh cao, cam kết 100% sản phẩm chính hãng, trải nghiệm tương lai và bảo hành tận tâm.</p>
      </div>
      <div class="footer-col">
        <h4>Sản phẩm</h4>
        <a href="/?cat=Điện thoại">Điện thoại</a>
        <a href="/?cat=Laptop">Laptop</a>
        <a href="/?cat=Tablet">Tablet</a>
        <a href="/?cat=Phụ kiện">Phụ kiện</a>
      </div>
      <div class="footer-col">
        <h4>Hỗ trợ</h4>
        <a href="/page/doi-tra">Chính sách đổi trả</a>
        <a href="/page/bao-hanh">Bảo hành</a>
        <a href="/page/van-chuyen">Vận chuyển</a>
        <a href="/page/faq">FAQ</a>
      </div>
      <div class="footer-col">
        <h4>Liên hệ</h4>
        <a href="/" class="footer-link">
          <span class="footer-icon-box">${Icons.mapPin}</span>
          <span class="footer-text">TP. Thái Nguyên</span>
        </a>
        <a href="tel:0969610085" class="footer-link">
          <span class="footer-icon-box">${Icons.phone}</span>
          <span class="footer-text">0969610085</span>
        </a>
        <a href="mailto:nguyendiem1892005@gmail.com" class="footer-link">
          <span class="footer-icon-box">${Icons.mail}</span>
          <span class="footer-text">nguyendiem1892005@gmail.com</span>
        </a>
        <a href="/" class="footer-link">
          <span class="footer-icon-box">${Icons.globe}</span>
          <span class="footer-text">Cellphone X</span>
        </a>
      </div>
    </div>
    <div class="footer-bottom">© 2026 Cellphone X — Made with ❤️ by Quốc Jee. All rights reserved.</div>
  </footer>`;
}

// ============================================================
// APP
// ============================================================

const app = new Hono();

// ---------- Trang chủ ----------
app.get("/", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const toast = c.req.query("added");

  const categories = ["Tất cả", ...new Set(products.map((p) => p.category))];
  const catHtml = categories
    .map(
      (cat, i) =>
        `<span class="cat-tag${i === 0 ? " active" : ""}">${cat}</span>`,
    )
    .join("");

  const cards = products
    .map(
      (p) => `
    <div class="card" data-category="${p.category}">
      <div class="card-img-wrap">
        <a href="/product/${p.id}"><img src="${p.image}" alt="${p.name}" loading="lazy"></a>
        ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ""}
        <span class="card-discount">-${discount(p.originalPrice, p.price)}%</span>
        <button class="card-wishlist" onclick="event.preventDefault()">${Icons.heart}</button>
      </div>
      <div class="card-body">
        <div class="card-meta">
          <div class="card-category">${p.category}</div>
          <div class="card-chip-tag">${p.chip}</div>
        </div>
        <h3><a href="/product/${p.id}">${p.name}</a></h3>
        <div class="card-specs">
          ${p.specs.map((s) => `<span class="spec-tag"><span class="spec-dot"></span>${s}</span>`).join("")}
        </div>
        <div class="card-stock">
          <span class="pulse-beacon"></span> Sẵn hàng hỏa tốc • Giao 2H
        </div>
        <div class="card-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span class="score">${p.rating}</span>
          <span class="count">(${p.reviews.toLocaleString("vi-VN")})</span>
        </div>
        <div class="card-prices">
          <span class="card-price">${formatVND(p.price)}</span>
          <span class="card-original">${formatVND(p.originalPrice)}</span>
        </div>
        <div class="card-actions">
          <form method="POST" action="/cart/add" style="flex:1;display:flex">
            <input type="hidden" name="id" value="${p.id}">
            <button class="btn btn-cyber" type="submit">${Icons.cart} <span>Thêm vào giỏ</span></button>
          </form>
          <a href="/product/${p.id}" class="btn btn-icon btn-ghost" title="Xem chi tiết">${Icons.eye}</a>
        </div>
      </div>
    </div>`,
    )
    .join("");

  const body = `
    ${heroSection()}
    <main>
      <div class="section-header">
        <h2 style="display:flex;align-items:center;gap:10px">${Icons.fire} <span>Siêu Phẩm Công Nghệ</span></h2>
      </div>
      <div class="categories">${catHtml}</div>
      <div class="grid">${cards}</div>
    </main>
    ${footerSection()}`;

  const addedProduct = toast
    ? products.find((p) => p.id === Number(toast))
    : null;
  return c.html(layout("Trang chủ", body, cart, { toast: addedProduct?.name }));
});

// ---------- Chi tiết sản phẩm ----------
app.get("/product/:id", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const id = Number(c.req.param("id"));
  const p = products.find((x) => x.id === id);

  if (!p) {
    const body = `<main><div class="empty"><div class="empty-icon">😢</div><h3>Sản phẩm không tồn tại</h3><p>Sản phẩm bạn tìm kiếm không có trong hệ thống.</p><a href="/" class="btn">← Về trang chủ</a></div></main>${footerSection()}`;
    return c.html(layout("Không tìm thấy", body, cart, { noHero: true }), 404);
  }

  const savedAmount = p.originalPrice - p.price;

  const body = `
  <main>
    <div class="breadcrumb">
      <a href="/">🏠 Trang chủ</a> <span class="sep">›</span>
      <span>${p.category}</span> <span class="sep">›</span>
      <span style="color:var(--text)">${p.name}</span>
    </div>
    <div class="detail">
      <div class="detail-gallery">
        <img src="${p.image}" alt="${p.name}">
      </div>
      <div class="detail-info">
        <div class="detail-tech-badge-row">
          ${p.badge ? `<span class="detail-badge">🏷️ ${p.badge}</span>` : ""}
          <span class="detail-chip-pill">${p.chip}</span>
          <span class="stock-pulse-detail"><span class="pulse-beacon"></span> Sẵn hàng hỏa tốc tại Thái Nguyên</span>
        </div>
        <h1>${p.name}</h1>
        <div class="detail-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span>${p.rating}/5</span>
          <span class="count">• ${p.reviews.toLocaleString("vi-VN")} đánh giá</span>
        </div>
        <div class="detail-prices">
          <span class="detail-price">${formatVND(p.price)}</span>
          <span class="detail-original">${formatVND(p.originalPrice)}</span>
          <span class="detail-save">Tiết kiệm ${formatVND(savedAmount)}</span>
        </div>
        <div class="detail-specs-highlight">
          ${p.specs.map((s) => `<div class="detail-spec-item"><span class="spec-icon">⚡</span><span>${s}</span></div>`).join("")}
        </div>
        <p class="detail-desc">${p.description}</p>
        <div class="detail-features">
          <div class="detail-feature"><span class="icon">${Icons.truck}</span> Miễn phí vận chuyển</div>
          <div class="detail-feature"><span class="icon">${Icons.check}</span> Chính hãng 100%</div>
          <div class="detail-feature"><span class="icon">${Icons.refresh}</span> Đổi trả 30 ngày</div>
          <div class="detail-feature"><span class="icon">${Icons.shield}</span> Bảo hành 12 tháng</div>
        </div>
        <div class="detail-actions">
          <form method="POST" action="/cart/add" style="flex:1;display:flex">
            <input type="hidden" name="id" value="${p.id}">
            <button class="btn btn-cyber" type="submit" style="flex:1">${Icons.cart} <span>Thêm vào giỏ hàng</span></button>
          </form>
          <a href="/" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:6px">${Icons.arrowLeft} <span>Tiếp tục mua</span></a>
        </div>
      </div>
    </div>
  </main>
  ${footerSection()}`;

  return c.html(layout(p.name, body, cart, { noHero: true }));
});

// ---------- Xem giỏ hàng ----------
app.get("/cart", (c) => {
  const cart = getCart(getCookie(c, "cart"));

  if (cart.length === 0) {
    const body = `<main><div class="empty"><div class="empty-icon" style="color:var(--primary);display:inline-flex;justify-content:center">${Icons.cart}</div><h3>Giỏ hàng trống</h3><p>Bạn chưa có sản phẩm nào trong giỏ hàng.</p><a href="/" class="btn" style="display:inline-flex;align-items:center;gap:8px">${Icons.home} <span>Khám phá sản phẩm</span></a></div></main>${footerSection()}`;
    return c.html(layout("Giỏ hàng", body, cart, { noHero: true }));
  }

  let subtotal = 0;
  let totalSaved = 0;

  const items = cart
    .map((item) => {
      const p = products.find((x) => x.id === item.id);
      if (!p) return "";
      const sub = p.price * item.qty;
      subtotal += sub;
      totalSaved += (p.originalPrice - p.price) * item.qty;
      return `
      <div class="cart-item">
        <a href="/product/${p.id}"><img class="cart-item-img" src="${p.image}" alt="${p.name}"></a>
        <div class="cart-item-info">
          <div class="cart-item-name"><a href="/product/${p.id}">${p.name}</a></div>
          <div class="cart-item-price">${formatVND(p.price)}</div>
        </div>
        <div class="cart-item-qty">
          <form method="POST" action="/cart/add" style="display:contents">
            <input type="hidden" name="id" value="${p.id}">
            <input type="hidden" name="action" value="decrease">
            <button type="submit">−</button>
          </form>
          <span>${item.qty}</span>
          <form method="POST" action="/cart/add" style="display:contents">
            <input type="hidden" name="id" value="${p.id}">
            <button type="submit">+</button>
          </form>
        </div>
        <div class="cart-item-subtotal">${formatVND(sub)}</div>
        <form method="POST" action="/cart/add" style="display:contents">
          <input type="hidden" name="id" value="${p.id}">
          <input type="hidden" name="action" value="remove">
          <button class="cart-item-remove" type="submit" title="Xóa">✕</button>
        </form>
      </div>`;
    })
    .join("");

  const body = `
  <main class="cart-container">
    <div class="section-header">
      <h2 style="display:flex;align-items:center;gap:10px">${Icons.cart} <span>Giỏ hàng của bạn</span></h2>
    </div>
    <div class="cart-layout">
      <div class="cart-items">${items}</div>
      <div class="cart-summary">
        <h3 style="display:flex;align-items:center;gap:8px">${Icons.check} <span>Tóm tắt đơn hàng</span></h3>
        <div class="summary-row"><span>Tạm tính (${cartCount(cart)} sản phẩm)</span><span>${formatVND(subtotal)}</span></div>
        <div class="summary-row save"><span>Tiết kiệm được</span><span>-${formatVND(totalSaved)}</span></div>
        <div class="summary-row"><span>Phí vận chuyển</span><span style="color:var(--success);font-weight:600">Miễn phí</span></div>
        <div class="summary-row total"><span>Tổng cộng</span><span class="val">${formatVND(subtotal)}</span></div>
        <button class="btn cart-checkout btn-cyber" onclick="alert('🎉 Cảm ơn bạn đã đặt hàng! Đơn hàng sẽ được xử lý trong 24h.')">${Icons.bolt} <span>Thanh toán ngay</span></button>
        <a href="/" class="btn btn-outline cart-continue" style="display:inline-flex;align-items:center;justify-content:center;gap:8px">${Icons.arrowLeft} <span>Tiếp tục mua sắm</span></a>
      </div>
    </div>
  </main>
  ${footerSection()}`;

  return c.html(layout("Giỏ hàng", body, cart, { noHero: true }));
});

// ---------- Thêm / Sửa / Xóa giỏ hàng ----------
app.post("/cart/add", async (c) => {
  const body = await c.req.parseBody();
  const id = Number(body["id"]);
  const action = (body["action"] as string) || "add";
  if (!products.find((p) => p.id === id)) return c.redirect("/");

  const cart = getCart(getCookie(c, "cart"));

  if (action === "remove") {
    const idx = cart.findIndex((i) => i.id === id);
    if (idx !== -1) cart.splice(idx, 1);
  } else if (action === "decrease") {
    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.qty--;
      if (existing.qty <= 0) {
        const idx = cart.findIndex((i) => i.id === id);
        if (idx !== -1) cart.splice(idx, 1);
      }
    }
  } else {
    const existing = cart.find((i) => i.id === id);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id, qty: 1 });
    }
  }

  setCookie(c, "cart", encodeURIComponent(JSON.stringify(cart)), {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (action === "add") {
    return c.redirect(`/?added=${id}`);
  }
  return c.redirect("/cart");
});

// ---------- Trang hỗ trợ ----------
interface PageData {
  title: string;
  icon: string;
  sections: { heading: string; content: string }[];
}

const pages: Record<string, PageData> = {
  "doi-tra": {
    title: "Chính sách đổi trả",
    icon: Icons.refresh,
    sections: [
      {
        heading: "1. Điều kiện đổi trả",
        content: `
          <ul>
            <li>Sản phẩm còn nguyên hộp, phụ kiện đi kèm đầy đủ</li>
            <li>Sản phẩm không có dấu hiệu va đập, trầy xước do người dùng</li>
            <li>Còn trong thời hạn <strong>30 ngày</strong> kể từ ngày mua</li>
            <li>Có hóa đơn mua hàng hoặc mã đơn hàng</li>
          </ul>`,
      },
      {
        heading: "2. Quy trình đổi trả",
        content: `
          <ol>
            <li><strong>Bước 1:</strong> Liên hệ hotline <strong>0969610085</strong> hoặc email <strong>nguyendiem1892005@gmail.com</strong></li>
            <li><strong>Bước 2:</strong> Nhân viên xác nhận yêu cầu và hướng dẫn gửi hàng</li>
            <li><strong>Bước 3:</strong> Gửi sản phẩm về Cellphone X (miễn phí vận chuyển)</li>
            <li><strong>Bước 4:</strong> Kiểm tra sản phẩm và hoàn tiền/đổi mới trong <strong>3-5 ngày làm việc</strong></li>
          </ol>`,
      },
      {
        heading: "3. Các trường hợp được đổi mới",
        content: `
          <ul>
            <li>Sản phẩm bị lỗi kỹ thuật do nhà sản xuất</li>
            <li>Sản phẩm giao không đúng mẫu, màu sắc, cấu hình đã đặt</li>
            <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển</li>
          </ul>`,
      },
      {
        heading: "4. Phương thức hoàn tiền",
        content: `<p>Hoàn tiền qua chuyển khoản ngân hàng trong vòng <strong>3-5 ngày làm việc</strong> sau khi xác nhận đổi trả thành công. Với thanh toán thẻ tín dụng, thời gian hoàn tiền tùy thuộc vào ngân hàng phát hành (5-15 ngày).</p>`,
      },
    ],
  },
  "bao-hanh": {
    title: "Chính sách bảo hành",
    icon: Icons.shield,
    sections: [
      {
        heading: "1. Thời gian bảo hành",
        content: `
          <table class="policy-table">
            <thead><tr><th>Loại sản phẩm</th><th>Thời gian</th><th>Hình thức</th></tr></thead>
            <tbody>
              <tr><td>Điện thoại</td><td>12 tháng</td><td>Hãng + Cellphone X</td></tr>
              <tr><td>Laptop</td><td>12 tháng</td><td>Hãng + Cellphone X</td></tr>
              <tr><td>Tablet</td><td>12 tháng</td><td>Hãng + Cellphone X</td></tr>
              <tr><td>Phụ kiện</td><td>6 tháng</td><td>Cellphone X</td></tr>
              <tr><td>Đồng hồ</td><td>12 tháng</td><td>Hãng</td></tr>
            </tbody>
          </table>`,
      },
      {
        heading: "2. Điều kiện bảo hành",
        content: `
          <ul>
            <li>Sản phẩm còn trong thời hạn bảo hành</li>
            <li>Tem bảo hành còn nguyên vẹn, không bị rách hay tẩy xóa</li>
            <li>Sản phẩm bị lỗi do nhà sản xuất (không do tác động bên ngoài)</li>
            <li>Có phiếu bảo hành hoặc hóa đơn mua hàng</li>
          </ul>`,
      },
      {
        heading: "3. Trường hợp không bảo hành",
        content: `
          <ul>
            <li>Sản phẩm hết thời hạn bảo hành</li>
            <li>Hư hỏng do va đập, rơi vỡ, vào nước</li>
            <li>Tự ý tháo lắp, sửa chữa bởi bên thứ ba</li>
            <li>Lỗi do sử dụng sai cách, cài phần mềm độc hại</li>
            <li>Hao mòn tự nhiên: pin, màn hình burn-in</li>
          </ul>`,
      },
      {
        heading: "4. Liên hệ bảo hành",
        content: `<p>Mang sản phẩm trực tiếp đến cửa hàng Cellphone X hoặc gọi hotline <strong>0969610085</strong> để được hỗ trợ. Thời gian bảo hành: <strong>7-14 ngày làm việc</strong> tùy tình trạng sản phẩm.</p>`,
      },
    ],
  },
  "van-chuyen": {
    title: "Chính sách vận chuyển",
    icon: Icons.truck,
    sections: [
      {
        heading: "1. Phạm vi giao hàng",
        content: `<p>Cellphone X giao hàng <strong>toàn quốc</strong> thông qua các đối tác vận chuyển uy tín: Giao Hàng Nhanh, Giao Hàng Tiết Kiệm, J&T Express, Viettel Post.</p>`,
      },
      {
        heading: "2. Thời gian giao hàng",
        content: `
          <table class="policy-table">
            <thead><tr><th>Khu vực</th><th>Thời gian</th><th>Phí vận chuyển</th></tr></thead>
            <tbody>
              <tr><td>Nội thành TP.HCM, Hà Nội</td><td>1-2 ngày</td><td style="color:var(--success);font-weight:600">Miễn phí</td></tr>
              <tr><td>Ngoại thành</td><td>2-3 ngày</td><td style="color:var(--success);font-weight:600">Miễn phí</td></tr>
              <tr><td>Tỉnh thành khác</td><td>3-5 ngày</td><td style="color:var(--success);font-weight:600">Miễn phí</td></tr>
              <tr><td>Vùng sâu, vùng xa, hải đảo</td><td>5-7 ngày</td><td>30.000đ</td></tr>
            </tbody>
          </table>`,
      },
      {
        heading: "3. Theo dõi đơn hàng",
        content: `<p>Sau khi đặt hàng, bạn sẽ nhận được mã vận đơn qua SMS/Email để theo dõi trạng thái giao hàng realtime trên website của đơn vị vận chuyển.</p>`,
      },
      {
        heading: "4. Kiểm tra hàng khi nhận",
        content: `
          <ul>
            <li>Kiểm tra bên ngoài kiện hàng trước khi ký nhận</li>
            <li>Quay video unbox để làm bằng chứng nếu có vấn đề</li>
            <li>Từ chối nhận nếu hàng bị móp, rách, ướt bất thường</li>
            <li>Liên hệ hotline ngay nếu sản phẩm không đúng đơn</li>
          </ul>`,
      },
    ],
  },
  faq: {
    title: "Câu hỏi thường gặp",
    icon: Icons.help,
    sections: [
      {
        heading: "Sản phẩm tại Cellphone X có chính hãng không?",
        content: `<p>100% sản phẩm tại Cellphone X đều là hàng <strong>chính hãng</strong>, nhập khẩu trực tiếp từ nhà phân phối ủy quyền. Mỗi sản phẩm đều có tem chống giả và phiếu bảo hành đầy đủ.</p>`,
      },
      {
        heading: "Tôi có thể thanh toán bằng hình thức nào?",
        content: `
          <ul>
            <li><strong>Thanh toán khi nhận hàng (COD)</strong> — Trả tiền mặt cho shipper</li>
            <li><strong>Chuyển khoản ngân hàng</strong> — Nhận thông tin sau khi đặt hàng</li>
            <li><strong>Ví điện tử</strong> — MoMo, ZaloPay, VNPay</li>
            <li><strong>Thẻ tín dụng/ghi nợ</strong> — Visa, Mastercard, JCB</li>
            <li><strong>Trả góp 0%</strong> — Qua thẻ tín dụng hoặc công ty tài chính</li>
          </ul>`,
      },
      {
        heading: "Tôi có thể hủy đơn hàng không?",
        content: `<p>Bạn có thể hủy đơn hàng <strong>miễn phí</strong> trước khi đơn hàng được giao cho đơn vị vận chuyển. Sau khi đã giao cho vận chuyển, phí hủy đơn là <strong>20.000đ</strong> (phí ship 1 chiều).</p>`,
      },
      {
        heading: "Làm sao để liên hệ hỗ trợ?",
        content: `
          <ul>
            <li><strong>Hotline:</strong> 0969610085 (8h-22h hàng ngày)</li>
            <li><strong>Live chat:</strong> Trực tiếp trên website (8h-22h)</li>
            <li><strong>Email:</strong> nguyendiem1892005@gmail.com (phản hồi trong 24h)</li>
            <li><strong>Cửa hàng:</strong> TP. Thái Nguyên</li>
          </ul>`,
      },
      {
        heading: "Sản phẩm có được dùng thử không?",
        content: `<p>Tại cửa hàng Cellphone X, bạn có thể trải nghiệm trực tiếp tất cả sản phẩm trưng bày trước khi quyết định mua. Với đơn hàng online, bạn có <strong>30 ngày đổi trả</strong> nếu không hài lòng.</p>`,
      },
    ],
  },
};

app.get("/page/:slug", (c) => {
  const cart = getCart(getCookie(c, "cart"));
  const slug = c.req.param("slug");
  const page = pages[slug];

  if (!page) {
    const body = `<main><div class="empty"><div class="empty-icon" style="color:var(--text-secondary);display:inline-flex;justify-content:center">${Icons.help}</div><h3>Trang không tồn tại</h3><p>Trang bạn tìm kiếm không có trong hệ thống.</p><a href="/" class="btn" style="display:inline-flex;align-items:center;gap:6px">${Icons.arrowLeft} <span>Về trang chủ</span></a></div></main>${footerSection()}`;
    return c.html(layout("Không tìm thấy", body, cart, { noHero: true }), 404);
  }

  const sectionsHtml = page.sections
    .map(
      (s, i) => `
      <div class="page-section" style="animation-delay:${i * 0.1}s">
        <h3>${s.heading}</h3>
        <div class="page-content">${s.content}</div>
      </div>`,
    )
    .join("");

  const body = `
  <main>
    <div class="breadcrumb">
      <a href="/" style="display:inline-flex;align-items:center;gap:5px">${Icons.home} <span>Trang chủ</span></a> <span class="sep">›</span>
      <span>Hỗ trợ</span> <span class="sep">›</span>
      <span style="color:var(--text)">${page.title}</span>
    </div>
    <div class="page-hero">
      <div class="page-hero-icon-box">${page.icon}</div>
      <h1>${page.title}</h1>
    </div>
    <div class="page-body">
      ${sectionsHtml}
    </div>
    <div style="text-align:center;margin-top:40px">
      <a href="/" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:6px">${Icons.arrowLeft} <span>Về trang chủ</span></a>
    </div>
  </main>
  ${footerSection()}`;

  return c.html(layout(page.title, body, cart, { noHero: true }));
});

export default app;
