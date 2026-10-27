# 📑 BÁO CÁO KỸ THUẬT TRIỂN KHAI HỆ THỐNG CELLPHONE X

## TRỌNG TÂM: CLOUDFLARE WORKERS AI (BGE-M3 & LLAMA 3.3 70B), D1 & VECTORIZE

---

## 📌 THÔNG TIN DỰ ÁN

| Mục                                     | Chi tiết                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Tên dự án**                           | **Cellphone X** — Nền tảng thương mại điện tử công nghệ thế hệ mới                             |
| **Mã nguồn (GitHub)**                   | [https://github.com/Quochandsome7/Demosanpham](https://github.com/Quochandsome7/Demosanpham)   |
| **Backend API (Cloudflare Worker)**     | [https://demosanpham.dtc235200623.workers.dev/](https://demosanpham.dtc235200623.workers.dev/) |
| **Frontend Website (Cloudflare Pages)** | [https://demosanpham.pages.dev/](https://demosanpham.pages.dev/)                               |
| **Tác giả / Phát triển**                | **nhóm 2**                                                                                     |

---

## 1. TỔNG QUAN HẠ TẦNG CLOUDFLARE WORKERS AI

### 1.1. Cloudflare Workers AI là gì?

Cloudflare Workers AI là nền tảng điện toán suy luận AI không máy chủ (Serverless AI Inference) chạy trực tiếp trên mạng lưới biên (Edge Network) của Cloudflare. Hệ thống tận dụng các cụm GPU chuyên dụng được phân bổ tại hàng trăm trung tâm dữ liệu toàn cầu để thực thi mô hình AI với độ trễ thấp và tính sẵn sàng cao.

### 1.2. Tại sao lựa chọn Cloudflare Workers AI?

1. **Không cần GPU Server riêng**: Loại bỏ hoàn toàn chi phí thuê VPS/GPU đắt đỏ và các thao tác vận hành phức tạp (Ollama, vLLM, FastAPI).
2. **Không phụ thuộc API bên thứ 3 (OpenAI/Anthropic)**: Tránh phát sinh chi phí theo từng triệu token của các bên cung cấp dịch vụ ngoài; tận dụng trọn vẹn quota serverless trong hệ sinh thái Cloudflare.
3. **Độ trễ mạng cực thấp (Zero Network Hop)**: Toàn bộ Backend (Hono Worker), Vector Database (Vectorize), Database quan hệ (D1) và Workers AI đều chạy chung trong một hạ tầng Cloudflare Edge, dữ liệu luân chuyển nội bộ với tốc độ cao nhất.
4. **Native Binding**: Kết nối trực tiếp qua biến môi trường `env.AI` mà không cần cấu hình API Key bí mật hay lo sợ rò rỉ token trên client.

### 1.3. Cấu hình Binding trong `wrangler.toml`

```toml
name = "demosanpham"
main = "src/index.ts"
compatibility_date = "2024-06-01"

# 1. AI Inference Engine
[ai]
binding = "AI"

# 2. Vector Database (1024 chiều, cosine similarity)
[[vectorize]]
binding = "VECTORIZE"
index_name = "cellphonex-products"

# 3. Database SQLite Serverless
[[d1_databases]]
binding = "DB"
database_name = "cellphonex-db"
database_id = "a6093079-830b-41e7-99dc-00f3d3dc5054"

[vars]
JWT_SECRET = "cellphonex-secret-key-2026"
FRONTEND_URL = "https://demosanpham.pages.dev"
```

---

## 2. HAI MÔ HÌNH AI CỐT LÕI

| Mô hình           | Định danh trên Workers AI                  | Vai trò kỹ thuật                                   | Đặc tính nổi bật                                                                                                      |
| ----------------- | ------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **BGE-M3**        | `@cf/baai/bge-m3`                          | **Text Embedding** (Biến đổi văn bản thành vector) | Hỗ trợ đa ngôn ngữ (Multilingual), xử lý tiếng Việt ngữ nghĩa sâu, tạo vector **1024 chiều**                          |
| **Llama 3.3 70B** | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | **Text Generation** (Sinh câu trả lời tiếng Việt)  | Quy mô **70 tỷ tham số**, tối ưu lượng tử hóa **fp8-fast**, phản xạ tiếng Việt chuẩn xác, tuân thủ prompt nghiêm ngặt |

---

## 3. KIẾN TRÚC RAG (RETRIEVAL-AUGMENTED GENERATION)

Kiến trúc RAG giải quyết bài toán cốt lõi: **Giúp AI trả lời chính xác theo dữ liệu thực tế của kho hàng Cellphone X mà không bịa đặt (Hallucination)**.

### 3.1. Sơ đồ luồng xử lý RAG

```
               Khách hàng đặt câu hỏi
                         ↓
               ChatWidget (Svelte 5)
                         ↓
                  POST /api/v1/chat
                         ↓
             Bộ lọc Intent nhanh (Regex)
      ┌──────────────────┴──────────────────┐
      ▼                                     ▼
Ý định chung (Chào, FAQ, CSKH)        Hỏi về sản phẩm cụ thể
      ↓                                     ↓
Trả lời ngay lập tức (<15ms)          BGE-M3 Embedding (1024 chiều)
(0 token, tiết kiệm quota AI)                ↓
                                      Cloudflare Vectorize (Cosine search top 4)
                                             ↓
                                      Lọc ngưỡng (Score >= 0.40 & TopScore - 0.12)
                                             ↓
                                      Truy xuất dữ liệu thực tế từ Cloudflare D1
                                             ↓
                                      Xây dựng Prompt (System Rules + Real Context)
                                             ↓
                                      Llama 3.3 70B (Sinh câu trả lời <150 từ)
                                             ↓
                                      Lọc thẻ sản phẩm liên quan (Relevant Sources)
                                             ↓
                                      Frontend hiển thị câu trả lời + Card sản phẩm
```

---

## 4. QUY TRÌNH 1: EMBEDDING DỮ LIỆU SẢN PHẨM VỚI BGE-M3

### 4.1. Chuẩn hóa ngữ nghĩa sản phẩm (`buildProductText`)

Mỗi sản phẩm trong bảng `products` được hàm `buildProductText()` chuyển thành chuỗi văn bản giàu ngữ cảnh tiếng Việt (tại `shop/backend/src/lib/rag.ts`):

```typescript
export function buildProductText(p: ProductDoc): string {
  const priceFormatted = new Intl.NumberFormat("vi-VN").format(p.price) + "₫";
  return [
    `Tên: ${p.name}`,
    `Danh mục: ${p.category_name || "Không rõ"}`,
    `Giá: ${priceFormatted}`,
    `Chip/CPU: ${p.chip || "Không rõ"}`,
    `Tồn kho: ${p.stock > 0 ? p.stock + " sản phẩm" : "HẾT HÀNG"}`,
    `Thông số: ${p.specs}`,
    `Mô tả: ${p.description}`,
    `Đặc điểm: ${p.badge}`,
  ]
    .filter(Boolean)
    .join("\n");
}
```

### 4.2. Gọi mô hình BGE-M3 (`embedTexts`)

```typescript
export async function embedTexts(ai: Ai, texts: string[]): Promise<number[][]> {
  const res = await ai.run("@cf/baai/bge-m3" as any, { text: texts });
  return res?.data ?? res; // Trả về mảng các vector số thực 1024 chiều
}
```

### 4.3. Lưu trữ vector vào Cloudflare Vectorize

```typescript
await env.VECTORIZE.upsert([
  {
    id: String(product.id),
    values: vector, // 1024 chiều
    metadata: {
      name: product.name,
      price: product.price,
      stock: product.stock,
      category_name: product.category_name,
    },
  },
]);
```

### 4.4. Cơ chế đồng bộ dữ liệu tự động

- **Khi thêm/sửa sản phẩm**: Backend tự động chạy hook `c.executionCtx.waitUntil(indexProduct(...))` để embed và upsert ngầm vào Vectorize mà không làm chậm thời gian phản hồi của trang Admin.
- **Khi xóa sản phẩm**: Tự động gọi `deleteProductIndex()` xóa vector khỏi index.
- **Endpoint re-index toàn bộ**: `POST /api/v1/chat/reindex` hỗ trợ embed batch 50 sản phẩm và upsert batch 100 vector.

---

## 5. QUY TRÌNH 2: TRUY XUẤT NGỮ NGHĨA (SEMANTIC RETRIEVAL)

### 5.1. Thuật toán lọc ngưỡng (Relevance Filtering)

Trong `shop/backend/src/routes/chat.ts`:

- **Ngưỡng sàn tuyệt đối**: `SIMILARITY_THRESHOLD = 0.40`. Mọi vector có điểm cosine dưới 0.40 đều bị loại bỏ ngay.
- **Ngưỡng chênh lệch tương đối (Relative Cutoff)**:
  ```typescript
  const topScore = validMatches[0].score;
  semanticMatches = validMatches.filter(
    (m) => m.score >= Math.max(0.4, topScore - 0.12),
  );
  ```
  Nếu kết quả top 1 đạt điểm rất cao (ví dụ: 0.85), các sản phẩm có điểm thấp hơn 0.73 sẽ bị lọc bớt, đảm bảo context đưa vào AI luôn tập trung nhất.

### 5.2. Fallback Keyword Search thông minh

Nếu Vectorize gặp trục trặc hoặc không có vector vượt ngưỡng, hệ thống kích hoạt hàm `extractKeywords()` loại bỏ stop-words tiếng Việt và chấm điểm trên các trường `name`, `chip`, `description` trong SQLite D1 để tìm sản phẩm thay thế.

---

## 6. QUY TRÌNH 3: SINH CÂU TRẢ LỜI VỚI LLAMA 3.3 70B & CHỐNG ẢO GIÁC

### 6.1. Thiết kế System Prompt nghiêm ngặt

```typescript
export function buildSystemPrompt(contextBlock: string): string {
  return `Bạn là trợ lý tư vấn bán hàng thông minh, thân thiện của Cellphone X.

THÔNG TIN CHUNG CỬA HÀNG CELLPHONE X:
- Thanh toán: Hỗ trợ COD (kiểm tra hàng), Chuyển khoản QR ngân hàng 24/7, Trả góp 0%.
- Bảo hành: Chính hãng 12 - 24 tháng cho máy, 6 tháng cho phụ kiện.
- Đổi trả: 1 đổi 1 trong 30 ngày nếu lỗi kỹ thuật.
- Vận chuyển: Miễn phí ship từ 500.000₫. Giao hỏa tốc 2 - 4 tiếng tại Thái Nguyên.
- Hotline: 0969610085. Địa chỉ: TP. Thái Nguyên.

QUY TẮC BẮT BUỘC — PHẢI TUÂN THỦ TUYỆT ĐỐI:
1. CHỈ trả lời dựa trên "THÔNG TIN CHUNG CỬA HÀNG" và "THÔNG TIN SẢN PHẨM" bên dưới.
2. TUYỆT ĐỐI KHÔNG tự bịa tên sản phẩm, giá bán, tồn kho, chip hay thông số kỹ thuật.
3. TUYỆT ĐỐI KHÔNG đề xuất bất kỳ sản phẩm nào ngoài danh sách được cung cấp.
4. Nếu tồn kho bằng 0 hoặc ghi "HẾT HÀNG", bắt buộc phải thông báo hết hàng.
5. Nếu khách hỏi sản phẩm mà cửa hàng không có, hãy trả lời chính xác:
   "Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp trong cửa hàng. Bạn có thể hỏi theo cách khác không?"
6. Trả lời bằng tiếng Việt, thân thiện, tự nhiên, đúng trọng tâm (dưới 150 từ).

${contextBlock}`;
}
```

### 6.2. Chốt chặn ngắt luồng sớm (Zero-Shot Guard)

Nếu qua bước Retrieval mà **không tìm thấy bất kỳ sản phẩm nào phù hợp**, hệ thống lập tức trả lời từ chối:

```typescript
if (contextProducts.length === 0) {
  return c.json({
    success: true,
    data: { answer: REJECT_ANSWER, sources: [] },
  });
}
```

**Hoàn toàn ngắt luồng, không gọi tới Llama 3.3 70B**:

- **Triệt tiêu 100% ảo giác (Hallucination)** vì AI không có cơ hội tự bịa sản phẩm ngoài đời.
- **Tiết kiệm tối đa quota token** của hệ thống.

### 6.3. Cấu hình tham số gọi Llama 3.3 70B

```typescript
const llmRes = await c.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ],
  max_tokens: 512,
  temperature: 0.2, // Nhiệt độ thấp giúp câu trả lời bám sát dữ liệu, chuẩn xác và nhất quán
});
```

### 6.4. Lọc thẻ sản phẩm đính kèm (Relevant Sources)

Hệ thống đối chiếu văn bản câu trả lời với tên và từ khóa sản phẩm:

```typescript
const relevantSources = contextProducts.filter((p) => {
  const pName = p.name.toLowerCase();
  const firstWord = pName.split(" ")[0]; // 'iphone', 'samsung', 'macbook'...
  return lowerAns.includes(pName) || lowerAns.includes(firstWord);
});
```

Chỉ những sản phẩm thực sự được nhắc đến trong câu trả lời mới được đính kèm Card tương tác để khách bấm xem chi tiết hoặc mua ngay.

---

## 7. BỘ LỌC Ý ĐỊNH HỘI THOẠI (INTENT ROUTING)

Hệ thống tích hợp bộ lọc Regex Intent xử lý các câu hỏi phổ biến dưới **15ms**, không tốn token AI:

- **Chào hỏi (`greeting`)**: Giới thiệu chatbot Cellphone X.
- **Quy trình thanh toán (`payment_process`)**: Giới thiệu VietQR, COD, trả góp 0%.
- **Chính sách bảo hành / đổi trả / vận chuyển**: Cung cấp chính sách chính thức của cửa hàng.
- **Thông tin liên hệ (`contact_info`)**: Cung cấp Hotline `0969610085`.
- **Hỏi danh sách sản phẩm (`list`)**: Truy vấn trực tiếp SQLite D1 gom nhóm theo danh mục.

---

## 8. CÁC TÍNH NĂNG BỔ TRỢ CỦA HỆ THỐNG CELLPHONE X

### 8.1. Tìm kiếm và Bộ lọc 1 hàng

- Bộ lọc tích hợp toàn diện trên 1 hàng (Desktop): Ô tìm kiếm từ khóa + Danh mục + Khoảng giá `Từ ₫ - Đến ₫` + Sắp xếp giá/tên + Nút Xóa lọc.
- Tìm kiếm tức thì (Live Quick Suggestions) trên Header hỗ trợ gõ tiếng Việt có dấu/không dấu, hiển thị ngay 5 kết quả gợi ý.

### 8.2. Sản phẩm yêu thích (Wishlist)

- Hoạt động session-based qua `x-session-id` và LocalStorage, không bắt buộc đăng nhập.
- Nút tim ở góc trên bên phải Product Card áp dụng **Optimistic UI Update** đổi màu tức thì.
- Trang `/wishlist` hỗ trợ quản lý và mua ngay sản phẩm đã lưu.

### 8.3. Giỏ hàng & Thanh toán VietQR

- Giỏ hàng HttpOnly Cookie 30 ngày an toàn.
- Nút "Mua ngay" chuyển thẳng vào trang `/checkout`.
- Hỗ trợ thanh toán **VietQR động chuẩn Napas 24/7** tích hợp 5 ngân hàng lớn (MB Bank, Vietcombank, Techcombank, BIDV, VPBank - STK `0969610085` - NGUYEN VAN QUOC) sinh mã QR kèm cú pháp đơn hàng `CPX{orderId}`.

---

## 9. BỘ CÂU HỎI & TRẢ LỜI BẢO VỆ CHUYÊN SÂU VỀ AI

### Câu 1: Tại sao hệ thống chọn mô hình BGE-M3 cho tác vụ Embedding?

> **Trả lời:**
> BGE-M3 (BAAI General Embedding) là mô hình embedding đa ngôn ngữ hiện đại, hỗ trợ hơn 100 ngôn ngữ, đặc biệt tiếng Việt được đánh giá rất cao. Mô hình trích xuất được ngữ nghĩa sâu của câu (Dense Retrieval) và tạo ra vector 1024 chiều. Các model khác như `bge-small-en` chỉ tối ưu cho tiếng Anh, nếu dùng cho tiếng Việt sẽ bị mất ngữ nghĩa.

### Câu 2: Llama 3.3 70B Instruct fp8-fast có ưu điểm gì so với các model 8B nhỏ hơn?

> **Trả lời:**
> Model quy mô 70 tỷ tham số có khả năng suy luận logic vượt trội và tuân thủ chặt chẽ các chỉ dẫn trong System Prompt (đặc biệt là các câu lệnh cấm: _không được bịa giá, không được đề xuất ngoài kho_). Bản `fp8-fast` đã được lượng tử hóa 8-bit dấu phẩy động, giúp tốc độ sinh từ (Token generation speed) cực nhanh trên hạ tầng Workers AI mà chất lượng câu trả lời tương đương bản 16-bit.

### Câu 3: Làm thế nào để khẳng định Chatbot không bao giờ nói sai giá hoặc bịa sản phẩm?

> **Trả lời:** Hệ thống có **3 lớp phòng thủ**:
>
> 1. **Dữ liệu thực tế**: Giá và tồn kho được lấy trực tiếp từ database D1 tại thời điểm khách hỏi rồi mới đưa vào Prompt.
> 2. **Chốt chặn Zero-Shot Guard**: Không tìm thấy sản phẩm trong Vectorize/DB thì lập tức trả lời từ chối, **không gọi LLM**.
> 3. **Tham số Temperature = 0.2**: Ép mô hình tập trung vào việc đọc và tóm tắt thông tin từ context, giảm tối đa tính ngẫu nhiên (creativity) vốn là nguyên nhân chính gây ảo giác.

### Câu 4: Sự khác biệt giữa Vectorize (Vector Search) và SQLite D1 (Keyword Search)?

> **Trả lời:**
>
> - **SQLite D1 (Keyword Search)**: So khớp ký tự chính xác. Nếu khách gõ _"máy tính mỏng nhẹ để làm đồ họa"_ thì câu lệnh `LIKE` sẽ không ra kết quả vì tên sản phẩm là _"MacBook Air M3"_.
> - **Vectorize (Semantic Search)**: So khớp ý nghĩa ngữ cảnh. BGE-M3 hiểu rằng _"máy tính mỏng nhẹ đồ họa"_ có khoảng cách vector rất gần với _"MacBook Air M3 mỏng 11.3mm, nặng 1.24kg, đồ họa 4K"_, do đó hệ thống vẫn truy xuất được sản phẩm chính xác.

### Câu 5: Hệ thống xử lý thế nào khi sản phẩm thay đổi giá hoặc hết hàng?

> **Trả lời:**
> Khi Admin cập nhật giá hoặc tồn kho trên trang quản trị, backend sẽ cập nhật bản ghi trong bảng `products` (D1) và đồng thời chạy hook `indexProduct()` để embed lại mô tả mới vào Cloudflare Vectorize. Do đó, câu hỏi tiếp theo của khách hàng sẽ ngay lập tức được trả lời với giá bán và tồn kho mới nhất.

---

## 10. TỔNG KẾT

Hệ thống AI tại **Cellphone X** đã khai thác tối đa sức mạnh của **Cloudflare Workers AI**:

1. Tự động hóa hoàn toàn quy trình tư vấn khách hàng bằng tiếng Việt tự nhiên.
2. Kiến trúc **RAG chuẩn mực**: BGE-M3 (Embedding) + Cloudflare Vectorize (Storage & Cosine Search) + Llama 3.3 70B (Generation).
3. Triệt tiêu hoàn toàn rủi ro ảo giác AI thông qua cơ chế lọc ngữ cảnh đa tầng và chốt chặn ngắt luồng sớm.
4. Tối ưu chi phí và độ trễ ở mức tối đa nhờ nền tảng Serverless Edge phân tán toàn cầu.
