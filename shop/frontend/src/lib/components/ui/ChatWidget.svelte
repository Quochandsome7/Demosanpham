<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { formatPrice } from '$lib/utils';
  import { api } from '$lib/api';

  // ─── State ─────────────────────────────────────────────────────────────────

  let isOpen = $state(false);
  let messages = $state<{
    role: 'user' | 'ai';
    content: string;
    sources?: {
      product_id: number;
      name: string;
      price: number;
      original_price?: number | null;
      image_url?: string | null;
      stock: number;
      badge?: string | null;
      category_name?: string | null;
    }[];
  }[]>([]);
  let inputMessage = $state('');
  let isTyping = $state(false);
  let messagesContainer = $state<HTMLDivElement | undefined>(undefined);

  // ─── Init ───────────────────────────────────────────────────────────────────

  onMount(() => {
    messages = [{
      role: 'ai',
      content: 'Xin chào! Tôi là trợ lý tư vấn của **Cellphone X** 🤖\n\nTôi có thể giúp bạn tìm kiếm sản phẩm, kiểm tra giá và tồn kho, hoặc tư vấn sản phẩm phù hợp.\n\n💬 Hãy đặt câu hỏi cho tôi!',
      sources: [],
    }];
  });

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function scrollToBottom() {
    await tick();
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  /** Chuyển **bold** và \n thành HTML */
  function formatMessage(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) scrollToBottom();
  }

  // ─── Gửi tin nhắn ───────────────────────────────────────────────────────────

  async function sendMessage() {
    const msg = inputMessage.trim();
    if (!msg || isTyping) return;

    inputMessage = '';
    messages = [...messages, { role: 'user', content: msg }];
    isTyping = true;
    scrollToBottom();

    try {
      const data = await api.chat(msg);

      if (data.success && data.data) {
        messages = [
          ...messages,
          {
            role: 'ai',
            content: data.data.answer || 'Xin lỗi, không có câu trả lời.',
            sources: data.data.sources || [],
          },
        ];
      } else {
        messages = [
          ...messages,
          { role: 'ai', content: data.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.', sources: [] },
        ];
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      messages = [
        ...messages,
        { role: 'ai', content: 'Mất kết nối đến máy chủ. Vui lòng thử lại sau.', sources: [] },
      ];
    } finally {
      isTyping = false;
      scrollToBottom();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ─── Câu hỏi gợi ý ──────────────────────────────────────────────────────────
  const SUGGESTIONS = [
    'Có những sản phẩm nào?',
    'iPhone 15 giá bao nhiêu?',
    'Tư vấn sản phẩm cho tôi',
  ];

  function useSuggestion(s: string) {
    inputMessage = s;
    sendMessage();
  }
</script>

<!-- ─── Floating Button ──────────────────────────────────────────────────── -->
<div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

  {#if !isOpen}
    <button
      onclick={toggleChat}
      class="w-14 h-14 bg-gradient-to-br from-cyber-600 to-neon-blue hover:from-cyber-500 hover:to-cyber-400 text-white rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(2,132,199,0.55)] hover:shadow-[0_0_36px_rgba(2,132,199,0.75)] transition-all cursor-pointer group"
      aria-label="Mở chatbot tư vấn"
      title="Tư vấn sản phẩm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    </button>
  {/if}

  <!-- ─── Chat Panel ──────────────────────────────────────────────────────── -->
  {#if isOpen}
    <div
      class="w-[calc(100vw-3rem)] sm:w-[340px] h-[500px] max-h-[calc(100vh-7rem)] bg-dark-900 border border-cyber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      <!-- Header -->
      <div class="h-14 shrink-0 bg-gradient-to-r from-dark-800 to-dark-900 border-b border-white/10 flex items-center justify-between px-4">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-cyber-500/20 border border-cyber-500/40 flex items-center justify-center text-base">🤖</div>
          <div>
            <div class="text-white text-sm font-semibold leading-tight">Trợ lý Cellphone X</div>
            <div class="flex items-center gap-1">
              <div class="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span class="text-[10px] text-green-400">Đang hoạt động</span>
            </div>
          </div>
        </div>
        <button
          onclick={toggleChat}
          class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-dark-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Đóng chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Messages -->
      <div bind:this={messagesContainer} class="flex-1 overflow-y-auto p-3 space-y-3">
        {#each messages as msg, i}
          <div class="flex flex-col {msg.role === 'user' ? 'items-end' : 'items-start'}">
            <!-- Bubble -->
            <div class="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
              {msg.role === 'user'
                ? 'bg-cyber-600 text-white rounded-tr-sm'
                : 'bg-dark-800 text-dark-100 border border-white/8 rounded-tl-sm'}">
              {@html formatMessage(msg.content)}
            </div>

            <!-- Gợi ý câu hỏi (chỉ cho tin đầu tiên) -->
            {#if msg.role === 'ai' && i === 0}
              <div class="mt-2 flex flex-wrap gap-1.5 self-start">
                {#each SUGGESTIONS as s}
                  <button
                    onclick={() => useSuggestion(s)}
                    class="text-[11px] bg-dark-800/80 border border-cyber-500/30 text-cyber-300 hover:bg-cyber-600/20 hover:text-white px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >{s}</button>
                {/each}
              </div>
            {/if}

            <!-- Source cards: sản phẩm liên quan -->
            {#if msg.role === 'ai' && msg.sources && msg.sources.length > 0}
              <div class="mt-2 w-full max-w-[90%] space-y-1.5 self-start">
                <div class="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1">
                  Sản phẩm liên quan ({msg.sources.length})
                </div>
                {#each msg.sources as p}
                  <div class="bg-dark-800/80 border border-white/8 rounded-xl p-2.5 flex items-center gap-2.5 hover:border-cyber-500/30 transition-colors">
                    <img
                      src={p.image_url || '/placeholder.png'}
                      alt={p.name}
                      class="w-10 h-10 object-contain rounded-lg bg-white/5 p-1 shrink-0 border border-white/5"
                    />
                    <div class="flex-1 min-w-0">
                      <div class="text-xs text-white font-medium truncate">{p.name}</div>
                      <div class="text-xs text-neon-blue font-bold">{formatPrice(p.price)}</div>
                      <div class="text-[10px] mt-0.5">
                        {#if p.stock <= 0}
                          <span class="text-red-400">❌ Hết hàng</span>
                        {:else}
                          <span class="text-green-400">✓ Còn {p.stock} hàng</span>
                        {/if}
                      </div>
                    </div>
                    <a
                      href="/product/{p.product_id}"
                      class="shrink-0 px-2.5 py-1 bg-cyber-600/20 hover:bg-cyber-600 text-cyber-300 hover:text-white rounded-lg text-xs border border-cyber-500/30 transition-colors"
                    >Xem</a>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}

        <!-- Typing indicator -->
        {#if isTyping}
          <div class="flex items-start">
            <div class="bg-dark-800 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span class="text-xs text-dark-300 mr-1">Đang tìm kiếm</span>
              <div class="w-1.5 h-1.5 bg-cyber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div class="w-1.5 h-1.5 bg-cyber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div class="w-1.5 h-1.5 bg-cyber-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        {/if}
      </div>

      <!-- Input -->
      <div class="p-3 bg-dark-800 border-t border-white/10 shrink-0">
        <div class="flex items-center gap-2">
          <input
            type="text"
            bind:value={inputMessage}
            onkeydown={handleKeydown}
            placeholder="Hỏi về sản phẩm..."
            class="flex-1 bg-dark-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500/30"
          />
          <button
            onclick={sendMessage}
            disabled={!inputMessage.trim() || isTyping}
            class="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-cyber-600 hover:bg-cyber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer text-white"
            aria-label="Gửi"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform rotate-90" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
        <p class="text-[10px] text-dark-500 mt-1.5 text-center">Trả lời dựa trên dữ liệu thực tế của cửa hàng</p>
      </div>
    </div>
  {/if}
</div>
