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
const SIMILARITY_THRESHOLD = 0.35;

/** Mô hình LLM chính */
const LLM_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/** Câu từ chối chuẩn khi không tìm thấy sản phẩm */
const REJECT_ANSWER =
  'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp trong cửa hàng. Bạn có thể hỏi theo cách khác không?';

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['có', 'không', 'những', 'nào', 'gì', 'giá', 'bao', 'nhiêu', 'tôi', 'muốn', 'mua', 'cho', 'với', 'của', 'ở', 'được', 'ạ', 'nhỉ', 'em', 'anh', 'chị', 'shop', 'cửa', 'hàng', 'còn', 'hết', 'bán', 'xin', 'hỏi', 'xem']);
  return text
    .toLowerCase()
    .replace(/[?,.!:;]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

// ─── Intent detection đơn giản ──────────────────────────────────────────────

function detectSimpleIntent(msg: string): string | null {
  const m = msg.toLowerCase().trim();

  if (/^(xin chào|chào|hello|hi|hey|alo|ơi)\b/.test(m)) return 'greeting';
  if (/^(cảm ơn|thank|cám ơn)\b/.test(m)) return 'thanks';
  if (/(có.*sản phẩm.*nào|danh sách sản phẩm|bán.*gì|shop có gì|xem tất cả)/.test(m)) return 'list';
  if (/^(mua|đặt|order)\s*$/.test(m)) return 'buy_generic';
  if (/^(tư vấn|gợi ý|recommend)\s*$/.test(m)) return 'advise_generic';

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
        answer: 'Xin chào! Tôi là trợ lý tư vấn của Cellphone X 🤖\n\nTôi có thể giúp bạn:\n• Tìm sản phẩm theo tên, thương hiệu, danh mục\n• Kiểm tra giá và tình trạng tồn kho\n• Tư vấn sản phẩm phù hợp nhu cầu\n\nBạn cần tìm gì ạ?',
        sources: [],
      },
    });
  }

  if (intent === 'thanks') {
    return c.json({
      success: true,
      data: {
        answer: 'Cảm ơn bạn đã ghé Cellphone X! 😊 Nếu cần tư vấn thêm, cứ hỏi em nhé!',
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
      listText += '\n\nBạn muốn tìm hiểu thêm về sản phẩm nào ạ?';

      return c.json({ success: true, data: { answer: listText, sources: [] } });
    } catch {
      return c.json({ success: true, data: { answer: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm. Vui lòng thử lại.', sources: [] } });
    }
  }

  if (intent === 'buy_generic') {
    return c.json({
      success: true,
      data: {
        answer: 'Bạn muốn mua loại sản phẩm nào ạ? Hãy cho tôi biết thêm:\n• Tên sản phẩm hoặc thương hiệu\n• Khoảng giá mong muốn\n• Mục đích sử dụng\n\nTôi sẽ tư vấn sản phẩm phù hợp nhất! 😊',
        sources: [],
      },
    });
  }

  if (intent === 'advise_generic') {
    return c.json({
      success: true,
      data: {
        answer: 'Tôi rất vui được tư vấn! 😊\n\nĐể tư vấn chính xác, bạn có thể cho biết:\n• Loại sản phẩm (điện thoại, laptop, tablet...)\n• Thương hiệu ưa thích\n• Khoảng giá dự kiến\n• Mục đích sử dụng chính\n\nVí dụ: "Tư vấn điện thoại Samsung tầm 20 triệu" ạ!',
        sources: [],
      },
    });
  }

  // 3. RAG Pipeline cho câu hỏi sản phẩm cụ thể
  try {
    // Bước A: Embed câu hỏi
    let semanticMatches: { id: string; score: number }[] = [];
    let ragAvailable = true;

    try {
      const rawMatches = await searchProducts(c.env, userMessage, 4);
      semanticMatches = rawMatches.filter(m => m.score >= SIMILARITY_THRESHOLD);
    } catch (e) {
      console.error('[RAG] Vectorize/embed error:', e);
      ragAvailable = false;
    }

    // Bước B: Nếu không có kết quả ngữ nghĩa → tìm DB trực tiếp (fallback)
    let contextProducts: any[] = [];

    if (ragAvailable && semanticMatches.length > 0) {
      // Lấy thông tin đầy đủ từ DB cho các product_id tìm thấy
      const idList = semanticMatches.map(m => m.id).join(',');
      const { results } = await c.env.DB.prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.id IN (${idList}) AND p.is_active = 1`
      ).all<any>();

      contextProducts = results.map(p => ({
        ...p,
        specs: p.specs ?? null,
      }));
    } else {
      // Fallback: keyword search trực tiếp DB thông minh
      const keywords = extractKeywords(userMessage);
      const { results } = await c.env.DB.prepare(
        `SELECT p.*, c.name as category_name
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.is_active = 1`
      ).all<any>();

      if (keywords.length > 0) {
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

    // Bước C: Nếu không có sản phẩm nào → trả câu từ chối (không gọi LLM)
    if (contextProducts.length === 0) {
      return c.json({
        success: true,
        data: { answer: REJECT_ANSWER, sources: [] },
      });
    }

    // Bước D: Build prompt và gọi LLM
    const { system, user } = buildChatPrompt(userMessage, contextProducts);

    let answer = '';
    try {
      const llmRes = await c.env.AI.run(LLM_MODEL as any, {
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 512,
        temperature: 0.3,
      }) as any;

      answer = llmRes?.response ?? llmRes?.result?.response ?? '';
    } catch (e) {
      console.error('[RAG] LLM error:', e);
      // Fallback: liệt kê sản phẩm tìm thấy
      const fmt = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';
      answer =
        `Tôi tìm thấy ${contextProducts.length} sản phẩm liên quan:\n` +
        contextProducts.map(p => `• **${p.name}**: ${fmt(p.price)} — ${p.stock > 0 ? `Còn ${p.stock} hàng` : '❌ Hết hàng'}`).join('\n') +
        '\n\nBạn muốn xem thêm thông tin về sản phẩm nào không?';
    }

    if (!answer.trim() || answer.includes('không tìm thấy sản phẩm')) {
      answer = REJECT_ANSWER;
      return c.json({ success: true, data: { answer, sources: [] } });
    }

    // Bước E: Build sources trả về cho frontend
    const sources: ChatSource[] = contextProducts.slice(0, 4).map(p => ({
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
