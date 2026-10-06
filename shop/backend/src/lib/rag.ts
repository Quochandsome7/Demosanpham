import type { Env } from "./types";

// ─── Định nghĩa kiểu dữ liệu ────────────────────────────────────────────────

export interface ProductDoc {
  id: number;
  name: string;
  price: number;
  original_price?: number | null;
  description?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  badge?: string | null;
  chip?: string | null;
  specs?: string | null;
  stock: number;
  image_url?: string | null;
  is_active?: number;
}

export interface ChatSource {
  product_id: number;
  name: string;
  price: number;
  original_price?: number | null;
  image_url?: string | null;
  stock: number;
  badge?: string | null;
  category_name?: string | null;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Chuyển sản phẩm thành văn bản chuẩn hóa tiếng Việt để embedding */
export function buildProductText(p: ProductDoc): string {
  const specsRaw = p.specs;
  let specText = "";
  if (specsRaw) {
    try {
      const arr = JSON.parse(specsRaw);
      specText = Array.isArray(arr) ? arr.join(", ") : specsRaw;
    } catch {
      specText = specsRaw;
    }
  }

  const priceFormatted = new Intl.NumberFormat("vi-VN").format(p.price) + "₫";
  const origFormatted =
    p.original_price && p.original_price > p.price
      ? " (Giá gốc: " +
        new Intl.NumberFormat("vi-VN").format(p.original_price) +
        "₫)"
      : "";

  return [
    `Tên: ${p.name}`,
    `Danh mục: ${p.category_name || "Không rõ"}`,
    `Giá: ${priceFormatted}${origFormatted}`,
    `Chip/CPU: ${p.chip || "Không rõ"}`,
    `Tồn kho: ${p.stock > 0 ? p.stock + " sản phẩm" : "HẾT HÀNG"}`,
    specText ? `Thông số: ${specText}` : "",
    p.description ? `Mô tả: ${p.description}` : "",
    p.badge ? `Đặc điểm: ${p.badge}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Tạo embedding cho một hoặc nhiều đoạn văn bản qua BGE-M3 */
export async function embedTexts(ai: Ai, texts: string[]): Promise<number[][]> {
  const res = (await ai.run("@cf/baai/bge-m3" as any, { text: texts })) as any;
  // bge-m3 trả về { data: number[][] }
  const embeddings: number[][] = res?.data ?? res;
  if (!Array.isArray(embeddings)) {
    throw new Error("Unexpected embedding response format");
  }
  return embeddings;
}

/** Upsert một sản phẩm vào Vectorize (gọi sau CREATE/UPDATE sản phẩm) */
export async function indexProduct(
  env: Env,
  product: ProductDoc,
): Promise<void> {
  const text = buildProductText(product);
  const [vector] = await embedTexts(env.AI, [text]);
  await env.VECTORIZE.upsert([
    {
      id: String(product.id),
      values: vector,
      metadata: {
        name: product.name,
        price: product.price,
        stock: product.stock,
        category_name: product.category_name ?? "",
      },
    },
  ]);
}

/** Xóa embedding của sản phẩm khỏi Vectorize (gọi sau DELETE/ẩn sản phẩm) */
export async function deleteProductIndex(
  env: Env,
  productId: number | string,
): Promise<void> {
  await env.VECTORIZE.deleteByIds([String(productId)]);
}

/** Tìm kiếm sản phẩm liên quan qua semantic search */
export async function searchProducts(
  env: Env,
  queryText: string,
  topK = 4,
): Promise<{ id: string; score: number }[]> {
  const [queryVector] = await embedTexts(env.AI, [queryText]);
  const result = await env.VECTORIZE.query(queryVector, {
    topK,
    returnMetadata: true,
  });
  return (result.matches ?? []).map((m: any) => ({ id: m.id, score: m.score }));
}

/** System prompt chống hallucination */
export function buildSystemPrompt(contextBlock: string): string {
  return `Bạn là trợ lý tư vấn bán hàng thông minh, thân thiện của Cellphone X.

THÔNG TIN CHUNG CỬA HÀNG CELLPHONE X:
- Thanh toán: Hỗ trợ COD (kiểm tra hàng trước khi thanh toán), Chuyển khoản QR ngân hàng 24/7, Trả góp 0% thẻ tín dụng.
- Quy trình mua hàng: Chọn sản phẩm -> Bấm "Mua ngay" hoặc "Thêm giỏ" -> Điền thông tin giao hàng -> Bấm "Đặt hàng".
- Bảo hành: Chính hãng 12 - 24 tháng cho máy, 6 tháng cho phụ kiện kèm theo.
- Đổi trả: 1 đổi 1 trong 30 ngày nếu lỗi kỹ thuật từ nhà sản xuất.
- Vận chuyển: Miễn phí vận chuyển cho đơn hàng từ 500.000₫ (toàn quốc). Nội thành Thái Nguyên giao hỏa tốc 2 - 4 tiếng; ngoại tỉnh 2 - 4 ngày.
- Hotline liên hệ: 0969610085. Địa chỉ: TP. Thái Nguyên.

QUY TẮC BẮT BUỘC — PHẢI TUÂN THỦ TUYỆT ĐỐI:
1. CHỈ trả lời dựa trên "THÔNG TIN CHUNG CỬA HÀNG" và "THÔNG TIN SẢN PHẨM" bên dưới.
2. TUYỆT ĐỐI KHÔNG tự bịa tên sản phẩm, giá bán, tồn kho, chip hay thông số kỹ thuật.
3. TUYỆT ĐỐI KHÔNG đề xuất bất kỳ sản phẩm nào ngoài danh sách được cung cấp.
4. Nếu khách hàng hỏi về một dòng sản phẩm chung (ví dụ "iPhone 15", "Samsung", "MacBook", "tai nghe"), hãy cung cấp thông tin của sản phẩm tương ứng có trong danh sách (ví dụ: iPhone 15 Pro Max, Galaxy S24 Ultra, MacBook Air M3, AirPods Pro 2).
5. Nếu tồn kho bằng 0 hoặc ghi "HẾT HÀNG", bắt buộc phải thông báo hết hàng.
6. Nếu khách hỏi sản phẩm mà cửa hàng không có, hãy trả lời chính xác: "Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp trong cửa hàng. Bạn có thể hỏi theo cách khác không?"
7. Trả lời bằng tiếng Việt, thân thiện, tự nhiên, đúng trọng tâm câu hỏi của khách hàng (dưới 150 từ). Luôn ghi rõ giá bán niêm yết (kèm đơn vị ₫) và tình trạng còn hàng nếu khách hỏi về giá hoặc tình trạng hàng.

${contextBlock}`;
}

/** Build user-facing prompt với context sản phẩm */
export function buildChatPrompt(
  question: string,
  products: ProductDoc[],
): { system: string; user: string } {
  let contextBlock: string;
  if (products.length === 0) {
    contextBlock =
      "THÔNG TIN SẢN PHẨM: (Không tìm thấy sản phẩm phù hợp trong cửa hàng)";
  } else {
    const lines = products.map((p) => buildProductText(p));
    contextBlock =
      "THÔNG TIN SẢN PHẨM TRONG CỬA HÀNG:\n\n" +
      lines.map((l, i) => `[Sản phẩm ${i + 1}]\n${l}`).join("\n\n");
  }

  return {
    system: buildSystemPrompt(contextBlock),
    user: `Câu hỏi của khách hàng: "${question}"\nHãy trả lời trực tiếp câu hỏi trên dựa trên THÔNG TIN SẢN PHẨM được cung cấp.`,
  };
}
