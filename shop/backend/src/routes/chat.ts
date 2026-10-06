import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Env } from '../types';
import {
  searchProducts,
  buildChatPrompt,
  indexProduct,
  deleteProductIndex,
  embedTexts,
  buildProductText,
  type ChatSource,
} from '../lib/rag';

const chat = new Hono<{ Bindings: Env }>();

// ─── Hằng số ────────────────────────────────────────────────────────────────

/** Ngưỡng cosine similarity tối thiểu để giữ kết quả từ Vectorize */
const SIMILARITY_THRESHOLD = 0.40;

/** Mô hình LLM chính */
const LLM_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/** Câu từ chối chuẩn khi không tìm thấy sản phẩm */
const REJECT_ANSWER =
  'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp trong cửa hàng. Bạn có thể hỏi theo cách khác không?';

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'có', 'không', 'những', 'nào', 'gì', 'giá', 'bao', 'nhiêu', 'tôi', 'muốn', 'mua',
    'cho', 'với', 'của', 'ở', 'được', 'ạ', 'nhỉ', 'em', 'anh', 'chị', 'shop', 'cửa',
    'hàng', 'còn', 'hết', 'bán', 'xin', 'hỏi', 'xem', 'sản', 'phẩm', 'tất', 'cả', 'này',
    'mình', 'giúp', 'giùm', 'đi', 'đang', 'loại', 'các'
  ]);
  return text
    .toLowerCase()
    .replace(/[?,.!:;]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

// ─── Intent detection đơn giản ──────────────────────────────────────────────

function detectSimpleIntent(msg: string): string | null {
  const m = msg.toLowerCase().trim().replace(/[?!.,]/g, '');

  // 1. Chào hỏi
  if (/^(xin chào|chào|hello|hi|hey|alo|ơi shop|chào shop|chào em|chào bạn)\b/.test(m)) {
    // Nếu kèm câu hỏi sản phẩm cụ thể (ví dụ "chào shop iphone 15 giá bao nhiêu") -> để RAG xử lý
    if (m.split(/\s+/).length > 4 && /(iphone|samsung|macbook|ipad|airpods|watch|giá|bao nhiêu|còn hàng|chuột)/.test(m)) {
      return null;
    }
    return 'greeting';
  }

  // 2. Cảm ơn
  if (/^(cảm ơn|thank|cám ơn|ok cảm ơn|thanks)\b/.test(m)) {
    return 'thanks';
  }

  // 3. Quy trình thanh toán / phương thức thanh toán
  if (/(thanh toán|trả tiền|chuyển khoản|cod|trả góp)/.test(m) &&
      /(quy trình|hình thức|phương thức|như thế nào|thế nào|ra sao|là gì|cách|hướng dẫn|chấp nhận|có được|bằng cách nào)/.test(m)) {
    return 'payment_process';
  }

  // 4. Quy trình đặt hàng / cách mua hàng
  if (/(đặt hàng|mua hàng|mua sản phẩm|order)/.test(m) &&
      /(quy trình|cách|hướng dẫn|làm sao|ra sao|như thế nào|thế nào|là gì|các bước|bước)/.test(m)) {
    return 'order_process';
  }

  // 5. Chính sách đổi trả
  if (/(đổi trả|đổi hàng|trả hàng|1 đổi 1)/.test(m)) {
    return 'return_policy';
  }

  // 6. Chính sách bảo hành
  if (/(bảo hành|bảo trì)/.test(m) && !/(iphone|samsung|macbook|ipad|airpods|watch)/.test(m)) {
    return 'warranty_policy';
  }

  // 7. Chính sách vận chuyển / phí ship
  if (/(vận chuyển|giao hàng|phí ship|tiền ship|giao nhận)/.test(m)) {
    return 'shipping_policy';
  }

  // 8. Địa chỉ / hotline / liên hệ
  if (/(địa chỉ|cửa hàng ở đâu|shop ở đâu|hotline|số điện thoại|sđt|liên hệ|fanpage|email)\b/.test(m)) {
    return 'contact_info';
  }

  // 9. Danh sách sản phẩm (hỏi chung cửa hàng có những sản phẩm nào)
  if (/^(có những sản phẩm nào|danh sách sản phẩm|bán những gì|shop có những gì|cửa hàng có gì|shop có gì|bán gì|ở đây có gì|xem tất cả sản phẩm|có các sản phẩm nào|các sản phẩm đang bán)\b/.test(m) ||
      m === 'có những sản phẩm nào' ||
      m === 'danh sách sản phẩm' ||
      m === 'có sản phẩm nào') {
    return 'list';
  }

  // 10. Mua hàng chung chung (không nêu rõ sản phẩm cụ thể)
  if (/^(mua|đặt|order|mua hàng|đặt hàng|muốn mua hàng|tôi muốn mua hàng|cách mua hàng|hướng dẫn mua hàng|mua như thế nào|tôi muốn mua)\b/.test(m)) {
    if (/(iphone|samsung|macbook|ipad|airpods|watch|chuột|tai nghe|laptop|điện thoại|máy tính)/.test(m)) {
      return null;
    }
    return 'buy_generic';
  }

  // 11. Tư vấn chung chung (không nêu rõ loại sản phẩm hoặc khoảng giá)
  if (/^(tư vấn|gợi ý|recommend|tư vấn cho tôi|tư vấn sản phẩm cho tôi|tư vấn giúp tôi|tư vấn giùm em|tư vấn cho mình|cần tư vấn|gợi ý cho tôi|nhờ tư vấn|tư vấn sản phẩm|tư vấn đi shop)\b/.test(m)) {
    if (/(điện thoại|laptop|tai nghe|đồng hồ|máy tính|ipad|iphone|samsung|macbook|airpods|triệu|k|tr)/.test(m)) {
      return null;
    }
    return 'advise_generic';
  }

  // 12. Hỏi còn hàng chung chung (không nói rõ sản phẩm nào)
  if (/^(sản phẩm còn hàng không|còn hàng không|hàng còn không|có còn hàng không)\b/.test(m)) {
    if (/(iphone|samsung|macbook|ipad|airpods|watch|chuột|tai nghe|laptop|điện thoại)/.test(m)) {
      return null;
    }
    return 'stock_generic';
  }

  return null;
}

// ─── POST /chat — Endpoint chính ────────────────────────────────────────────

chat.post('/', async (c) => {
  // 1. Validate input
  const body = await c.req.json().catch(() => null);
  if (!body?.message || typeof body.message !== 'string') {
    return c.json({ success: false, error: 'Vui lòng nhập câu hỏi.' }, 400);
  }

  const userMessage = body.message.trim();
  if (!userMessage || userMessage.length > 500) {
    return c.json({ success: false, error: 'Câu hỏi không hợp lệ (tối đa 500 ký tự).' }, 400);
  }

  // 2. Xử lý intent đơn giản (không tốn quota AI)
  const intent = detectSimpleIntent(userMessage);

  if (intent === 'greeting') {
    return c.json({
      success: true,
      data: {
        answer: 'Xin chào anh/chị! Em là trợ lý tư vấn của **Cellphone X** 🤖\n\nEm có thể hỗ trợ anh/chị:\n• Tra cứu giá bán và tình trạng còn hàng\n• Tìm kiếm sản phẩm theo thương hiệu, nhu cầu\n• Hướng dẫn đặt hàng, thanh toán và bảo hành\n\nAnh/chị đang quan tâm đến sản phẩm nào ạ?',
        sources: [],
      },
    });
  }

  if (intent === 'thanks') {
    return c.json({
      success: true,
      data: {
        answer: 'Dạ không có gì ạ! Rất vui được hỗ trợ anh/chị. Nếu cần thêm thông tin gì về sản phẩm, anh/chị cứ nhắn em nhé! Chúc anh/chị một ngày tuyệt vời ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'payment_process') {
    return c.json({
      success: true,
      data: {
        answer: 'Dạ, quy trình và các hình thức thanh toán tại **Cellphone X** rất đơn giản và an toàn ạ:\n\n💳 **1. Các hình thức thanh toán hỗ trợ:**\n• **Thanh toán khi nhận hàng (COD):** Quý khách được đồng kiểm tra máy trước khi thanh toán cho bưu tá.\n• **Chuyển khoản ngân hàng:** Quét mã QR chuyển khoản 24/7 an toàn, tiện lợi.\n• **Trả góp 0%:** Hỗ trợ qua thẻ tín dụng và đối tác tài chính.\n\n📋 **2. Quy trình thanh toán:**\n• **Bước 1:** Bấm **"Mua ngay"** tại sản phẩm muốn mua.\n• **Bước 2:** Vào trang **Thanh toán**, điền Họ tên, Số điện thoại và Địa chỉ nhận hàng.\n• **Bước 3:** Bấm **"Đặt hàng"**, nhân viên cửa hàng sẽ gọi xác nhận và gửi hàng tận nơi cho mình ạ!\n\nAnh/chị cần hỗ trợ đặt sản phẩm nào cứ nhắn em nhé! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'order_process') {
    return c.json({
      success: true,
      data: {
        answer: 'Quy trình đặt hàng tại **Cellphone X** chỉ với 4 bước cực kỳ nhanh chóng:\n\n🛒 **Bước 1:** Chọn sản phẩm yêu thích trên website Cellphone X.\n📦 **Bước 2:** Bấm **"Mua ngay"** (để thanh toán luôn) hoặc **"Thêm giỏ"** nếu muốn chọn thêm phụ kiện.\n📝 **Bước 3:** Nhập thông tin nhận hàng gồm: Họ tên, Số điện thoại và Địa chỉ giao hàng.\n✅ **Bước 4:** Bấm **"Đặt hàng"**. Hệ thống sẽ ghi nhận và nhân viên sẽ liên hệ xác nhận lộ trình giao hàng ngay cho anh/chị.\n\nĐặc biệt, Cellphone X **miễn phí giao hàng** cho tất cả đơn từ 500.000₫ ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'warranty_policy') {
    return c.json({
      success: true,
      data: {
        answer: 'Chính sách bảo hành tại **Cellphone X** cam kết bảo vệ quyền lợi tối đa cho khách hàng:\n\n🛡️ **Thời gian bảo hành:**\n• Bảo hành chính hãng **12 - 24 tháng** đối với thân máy (tùy dòng máy).\n• Bảo hành **6 tháng** đối với phụ kiện kèm theo.\n\n📋 **Điều kiện bảo hành:**\n• Máy còn trong hạn bảo hành và tem bảo hành còn nguyên vẹn.\n• Lỗi kỹ thuật phát sinh từ nhà sản xuất.\n• Quý khách có thể mang máy qua Cellphone X hoặc Trung tâm bảo hành ủy quyền trên toàn quốc.\n\nHotline hỗ trợ kỹ thuật: **0969610085** ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'return_policy') {
    return c.json({
      success: true,
      data: {
        answer: 'Chính sách đổi trả tại **Cellphone X**:\n\n🔄 **Đổi mới 30 ngày:**\n• Áp dụng chính sách **1 đổi 1 trong vòng 30 ngày** nếu máy có lỗi phần cứng từ nhà sản xuất.\n• Máy còn nguyên vẹn, không trầy xước, còn đầy đủ hộp, phụ kiện và hóa đơn.\n\n❌ **Trường hợp không hỗ trợ:** Máy bị rơi vỡ, va đập, ngấm nước hoặc can thiệp phần cứng trái phép.\n\nHotline tiếp nhận đổi trả: **0969610085** ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'shipping_policy') {
    return c.json({
      success: true,
      data: {
        answer: 'Chính sách vận chuyển tại **Cellphone X**:\n\n🚚 **Phí vận chuyển:**\n• **MIỄN PHÍ VẬN CHUYỂN** toàn quốc cho đơn hàng từ 500.000₫.\n• Phí ship 30.000₫ cho đơn dưới 500.000₫.\n\n⏱️ **Thời gian giao hàng:**\n• Khu vực TP. Thái Nguyên: Giao hỏa tốc trong 2 - 4 tiếng.\n• Các tỉnh thành khác: Giao tận tay từ 2 - 4 ngày làm việc.\n\nQuý khách được quyền **đồng kiểm hàng cùng shipper** trước khi thanh toán ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'contact_info') {
    return c.json({
      success: true,
      data: {
        answer: 'Thông tin liên hệ của **Cellphone X**:\n\n📍 **Địa chỉ:** TP. Thái Nguyên\n📞 **Hotline:** **0969610085**\n✉️ **Email:** nguyendiem1892005@gmail.com\n⏰ **Giờ làm việc:** 8:00 - 21:30 hàng ngày\n\nCellphone X rất hân hạnh được hỗ trợ anh/chị ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'list') {
    try {
      const { results } = await c.env.DB.prepare(
        `SELECT p.name, p.price, p.stock, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = 1 ORDER BY c.name, p.name LIMIT 20`
      ).all<any>();

      if (!results.length) {
        return c.json({ success: true, data: { answer: 'Cửa hàng hiện chưa có sản phẩm nào ạ.', sources: [] } });
      }

      const grouped: Record<string, string[]> = {};
      for (const p of results) {
        const cat = p.category_name || 'Khác';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p.name);
      }

      let listText = 'Cửa hàng hiện có các sản phẩm sau:\n';
      for (const [cat, names] of Object.entries(grouped)) {
        listText += `\n📦 **${cat}:**\n${names.map(n => `  • ${n}`).join('\n')}`;
      }
      listText += '\n\nAnh/chị muốn tìm hiểu thêm về sản phẩm nào ạ?';

      return c.json({ success: true, data: { answer: listText, sources: [] } });
    } catch {
      return c.json({ success: true, data: { answer: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm. Vui lòng thử lại.', sources: [] } });
    }
  }

  if (intent === 'buy_generic') {
    return c.json({
      success: true,
      data: {
        answer: 'Anh/chị muốn mua loại sản phẩm nào ạ? Hãy cho em biết thêm về:\n• Tên sản phẩm hoặc thương hiệu anh/chị quan tâm\n• Nhu cầu sử dụng chính (làm việc, học tập, chụp ảnh, giải trí...)\n• Khoảng giá dự kiến\n\nEm sẽ gợi ý sản phẩm phù hợp nhất cho anh/chị ngay ạ! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'advise_generic') {
    return c.json({
      success: true,
      data: {
        answer: 'Em rất vui được hỗ trợ tư vấn cho anh/chị! 😊\n\nĐể em gợi ý chính xác nhất, anh/chị có thể cho em biết thêm:\n• Loại sản phẩm đang quan tâm (Điện thoại, Laptop, Tablet, Tai nghe, Đồng hồ...)\n• Thương hiệu yêu thích (Apple, Samsung...)\n• Tầm giá mong muốn\n• Nhu cầu sử dụng hàng ngày\n\nVí dụ: "Tư vấn điện thoại tầm 25 triệu" hoặc "Tư vấn laptop pin trâu" ạ!',
        sources: [],
      },
    });
  }

  if (intent === 'stock_generic') {
    return c.json({
      success: true,
      data: {
        answer: 'Hiện tại tất cả các sản phẩm đang hiển thị tại Cellphone X đều đang còn hàng sẵn trong kho ạ! 🎉\n\nAnh/chị đang quan tâm đến sản phẩm cụ thể nào (ví dụ: iPhone 15 Pro Max, Galaxy S24 Ultra, MacBook Air M3, iPad Pro M4, AirPods Pro 2, Apple Watch Ultra 2) để em kiểm tra số lượng chi tiết cho mình nhé! 😊',
        sources: [],
      },
    });
  }

  // 3. RAG Pipeline cho câu hỏi sản phẩm cụ thể
  try {
    // Bước A: Semantic search trong Vectorize
    let rawMatches: { id: string; score: number }[] = [];
    let semanticMatches: { id: string; score: number }[] = [];
    let ragAvailable = true;

    try {
      rawMatches = await searchProducts(c.env, userMessage, 4);
      rawMatches.sort((a, b) => b.score - a.score);
      const validMatches = rawMatches.filter(m => m.score >= SIMILARITY_THRESHOLD);

      if (validMatches.length > 0) {
        const topScore = validMatches[0].score;
        // Chỉ giữ những sản phẩm có điểm số gần với kết quả tốt nhất (chênh lệch tối đa 0.12)
        semanticMatches = validMatches.filter(m => m.score >= Math.max(SIMILARITY_THRESHOLD, topScore - 0.12));
      }
    } catch (e) {
      console.error('[RAG] Vectorize/embed error:', e);
      ragAvailable = false;
    }

    // Bước B: Lấy thông tin sản phẩm từ DB hoặc fallback tìm kiếm từ khóa
    let contextProducts: any[] = [];

    if (ragAvailable && semanticMatches.length > 0) {
      const idList = semanticMatches.map(m => m.id).join(',');
      const { results } = await c.env.DB.prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id IN (${idList}) AND p.is_active = 1`
      ).all<any>();

      // Sắp xếp contextProducts đúng theo thứ tự độ tương đồng (semanticMatches)
      const productMap = new Map(results.map(p => [String(p.id), p]));
      contextProducts = semanticMatches
        .map(m => productMap.get(m.id))
        .filter((p): p is any => !!p)
        .map(p => ({
          ...p,
          specs: p.specs ?? null,
        }));
    } else {
      // Fallback: Tìm kiếm từ khóa thông minh trong DB
      const keywords = extractKeywords(userMessage);
      if (keywords.length > 0) {
        const { results } = await c.env.DB.prepare(
          `SELECT p.*, c.name as category_name
           FROM products p LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.is_active = 1`
        ).all<any>();

        const scored = results.map(p => {
          const target = `${p.name} ${p.chip || ''} ${p.description || ''} ${p.category_name || ''} ${p.badge || ''}`.toLowerCase();
          let score = 0;
          for (const kw of keywords) {
            if (target.includes(kw)) score++;
          }
          return { product: p, score };
        }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);

        contextProducts = scored.slice(0, 4).map(item => ({
          ...item.product,
          specs: item.product.specs ?? null
        }));
      }
    }

    // Bước C: Nếu không có sản phẩm nào → trả câu từ chối chuẩn (không gọi LLM, không hallucinate)
    if (contextProducts.length === 0) {
      return c.json({
        success: true,
        data: { answer: REJECT_ANSWER, sources: [] },
      });
    }

    // Bước D: Build prompt và gọi LLM Llama 3.3 70B
    const { system, user } = buildChatPrompt(userMessage, contextProducts);

    let answer = '';
    try {
      const llmRes = await c.env.AI.run(LLM_MODEL as any, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 512,
        temperature: 0.2,
      }) as any;

      answer = llmRes?.response ?? llmRes?.result?.response ?? '';
    } catch (e) {
      console.error('[RAG] LLM error:', e);
      // Fallback khi AI quá tải: trả về danh sách sản phẩm rõ ràng
      const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';
      answer =
        `Em tìm thấy ${contextProducts.length} sản phẩm liên quan tại cửa hàng:\n` +
        contextProducts.map(p => `• **${p.name}**: ${fmt(p.price)} — ${p.stock > 0 ? `Còn ${p.stock} sản phẩm` : '❌ Hết hàng'}`).join('\n') +
        '\n\nAnh/chị cần xem thêm thông tin chi tiết về sản phẩm nào không ạ?';
    }

    if (!answer.trim()) {
      const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';
      answer =
        `Em tìm thấy ${contextProducts.length} sản phẩm liên quan tại cửa hàng:\n` +
        contextProducts.map(p => `• **${p.name}**: ${fmt(p.price)} — ${p.stock > 0 ? `Còn ${p.stock} sản phẩm` : '❌ Hết hàng'}`).join('\n') +
        '\n\nAnh/chị cần xem thêm thông tin chi tiết về sản phẩm nào không ạ?';
    }

    const lowerAns = answer.toLowerCase();
    const isRefusal =
      answer.trim() === REJECT_ANSWER ||
      answer.includes(REJECT_ANSWER) ||
      lowerAns.includes('không tìm thấy thông tin') ||
      lowerAns.includes('không tìm thấy sản phẩm') ||
      lowerAns.includes('không có thông tin') ||
      lowerAns.includes('xin lỗi, tôi không') ||
      lowerAns.includes('xin lỗi, em không');

    if (isRefusal) {
      return c.json({ success: true, data: { answer, sources: [] } });
    }

    // Chỉ đính kèm thẻ sản phẩm nếu câu trả lời thực sự nhắc đến sản phẩm đó
    const relevantSources = contextProducts.filter(p => {
      const pName = p.name.toLowerCase();
      const firstWord = pName.split(' ')[0]; // 'iphone', 'samsung', 'macbook', 'ipad', 'airpods', 'apple'
      return lowerAns.includes(pName) || lowerAns.includes(firstWord);
    });

    // Bước E: Build sources trả về cho frontend (chỉ chứa sản phẩm thực sự liên quan)
    const sources: ChatSource[] = relevantSources.slice(0, 4).map(p => ({
      product_id: p.id,
      name: p.name,
      price: p.price,
      original_price: p.original_price ?? null,
      image_url: p.image_url ?? null,
      stock: p.stock,
      badge: p.badge ?? null,
      category_name: p.category_name ?? null,
    }));

    return c.json({ success: true, data: { answer, sources } });

  } catch (err: any) {
    console.error('[chat] Unhandled error:', err);
    return c.json({ success: false, error: 'Có lỗi xảy ra, vui lòng thử lại.' }, 500);
  }
});

// ─── POST /chat/reindex — Bootstrap & full re-index (admin / secret key) ────

chat.post('/reindex', async (c) => {
  const authHeader = c.req.header('Authorization');
  const secret = c.req.query('secret') || c.req.header('x-reindex-secret');
  const isSecretValid = secret === c.env.JWT_SECRET || secret === 'cellphonex-secret-key-2026';

  if (!isSecretValid && !authHeader) {
    return c.json({ success: false, error: 'Unauthorized. Vui lòng cung cấp Authorization header hoặc secret.' }, 401);
  }
  try {
    const { results: products } = await c.env.DB.prepare(
      `SELECT p.*, c.name as category_name
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1`
    ).all<any>();

    if (!products.length) {
      return c.json({ success: true, message: 'Không có sản phẩm nào để index.' });
    }

    // Build texts
    const texts = products.map((p: any) => buildProductText({ ...p, specs: p.specs ?? null }));

    // Embed in batches of 50 (tránh timeout)
    const EMBED_BATCH = 50;
    const allVectors: { id: string; values: number[]; metadata: Record<string, any> }[] = [];

    for (let i = 0; i < texts.length; i += EMBED_BATCH) {
      const batchTexts = texts.slice(i, i + EMBED_BATCH);
      const batchProducts = products.slice(i, i + EMBED_BATCH);
      const embeddings = await embedTexts(c.env.AI, batchTexts);

      for (let j = 0; j < batchProducts.length; j++) {
        const p = batchProducts[j] as any;
        allVectors.push({
          id: String(p.id),
          values: embeddings[j],
          metadata: {
            name: p.name,
            price: p.price,
            stock: p.stock,
            category_name: p.category_name ?? '',
          },
        });
      }
    }

    // Upsert vào Vectorize theo batch 100
    const UPSERT_BATCH = 100;
    for (let i = 0; i < allVectors.length; i += UPSERT_BATCH) {
      await c.env.VECTORIZE.upsert(allVectors.slice(i, i + UPSERT_BATCH));
    }

    return c.json({
      success: true,
      message: `Đã index ${allVectors.length} sản phẩm vào Vectorize thành công!`,
      count: allVectors.length,
    });
  } catch (err: any) {
    console.error('[reindex] Error:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default chat;
