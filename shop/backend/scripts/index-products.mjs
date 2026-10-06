// Script bootstrap / re-index sản phẩm thủ công qua API endpoint POST /api/v1/chat/reindex
// Cách dùng: node scripts/index-products.mjs <API_URL> <ADMIN_TOKEN>

const API_URL = process.argv[2] || 'https://demosanpham.dtc235200623.workers.dev';
const TOKEN = process.argv[3] || '';

console.log(`Bắt đầu đồng bộ vector sản phẩm lên ${API_URL}...`);

async function main() {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

    const res = await fetch(`${API_URL}/api/v1/chat/reindex`, {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    console.log('Kết quả:', data);
  } catch (err) {
    console.error('Lỗi khi re-index:', err);
  }
}

main();
