<script lang="ts">
  import { icons } from '../../icons';
  import { cart, cartTotal } from '../../stores/cart';
  import { formatPrice } from '../../utils';
  
  let { isOpen = $bindable(false) } = $props<{ isOpen?: boolean }>();
  
  let cartItems = $derived($cart.items);
  let total = $derived($cartTotal);
  
  function updateQuantity(id: number, current: number, change: number) {
    const newQuantity = current + change;
    if (newQuantity < 1) return;
    cart.updateItem(id, newQuantity);
  }
  
  function removeItem(id: number) {
    cart.removeItem(id);
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div 
    class="fixed inset-0 bg-dark-950/80 backdrop-blur-sm z-50 transition-opacity animate-fade-in"
    onclick={() => isOpen = false}
    onkeydown={(e) => { if (e.key === 'Escape') isOpen = false; }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label="Giỏ hàng"
  >
    <!-- Drawer Container -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
      class="fixed top-0 right-0 h-full w-full max-w-md bg-dark-950 border-l border-white/10 z-50 flex flex-col shadow-2xl animate-slide-up text-white"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-white/5 bg-dark-900/60">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <div class="w-5 h-5 text-cyber-500">{@html icons.cart}</div>
          Giỏ hàng ({cartItems.length})
        </h2>
        <button 
          onclick={() => isOpen = false}
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-dark-800 text-dark-300 hover:text-white transition-colors border border-white/5"
          aria-label="Đóng giỏ hàng"
        >
          <div class="w-4 h-4">{@html icons.close}</div>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {#if cartItems.length === 0}
          <div class="h-full flex flex-col items-center justify-center text-dark-400 gap-4 py-16">
            <div class="w-16 h-16 opacity-30 text-cyber-400">{@html icons.shoppingBag}</div>
            <p class="text-sm">Giỏ hàng của bạn đang trống</p>
            <button 
              onclick={() => isOpen = false}
              class="text-xs px-4 py-2 rounded-xl bg-cyber-500/10 border border-cyber-500/30 text-cyber-400 hover:bg-cyber-500 hover:text-white font-medium transition-all"
            >
              Tiếp tục xem sản phẩm
            </button>
          </div>
        {:else}
          <div class="flex flex-col gap-3">
            {#each cartItems as item (item.id)}
              <div class="flex gap-3.5 bg-dark-900/50 p-3 rounded-2xl border border-white/5 relative group">
                <img 
                  src={item.product?.image_url || item.image_url || '/placeholder.png'} 
                  alt={item.product?.name || item.name} 
                  class="w-16 h-16 object-contain rounded-xl bg-white/5 p-1 shrink-0"
                />
                <div class="flex-1 flex flex-col justify-between min-w-0 pr-6">
                  <div>
                    <h3 class="text-white text-xs font-semibold line-clamp-2 leading-tight">
                      {item.product?.name || item.name}
                    </h3>
                    <div class="text-neon-blue font-bold text-sm mt-1">
                      {formatPrice(item.product?.price ?? item.price ?? 0)}
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center bg-dark-800/80 rounded-lg overflow-hidden border border-white/10 text-xs">
                      <button 
                        class="w-7 h-7 flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        onclick={() => updateQuantity(item.id, item.quantity, -1)}
                      >-</button>
                      <span class="w-7 text-center font-bold text-white">{item.quantity}</span>
                      <button 
                        class="w-7 h-7 flex items-center justify-center text-dark-300 hover:text-white hover:bg-dark-700 transition-colors"
                        onclick={() => updateQuantity(item.id, item.quantity, 1)}
                      >+</button>
                    </div>
                  </div>
                </div>
                
                <button 
                  onclick={() => removeItem(item.id)}
                  class="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors"
                  title="Xóa món này"
                >
                  <div class="w-3.5 h-3.5">{@html icons.trash}</div>
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if cartItems.length > 0}
        <div class="p-4 border-t border-white/5 bg-dark-900/90 backdrop-blur-md space-y-3">
          <div class="flex justify-between items-baseline">
            <span class="text-xs text-dark-300">Tổng tạm tính:</span>
            <span class="text-neon-blue font-extrabold text-xl">{formatPrice(total)}</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <a 
              href="/cart"
              onclick={() => isOpen = false}
              class="py-3 px-3 bg-dark-800 hover:bg-dark-700 text-white text-xs font-semibold rounded-xl text-center border border-white/10 transition-colors"
            >
              Xem chi tiết giỏ
            </a>
            <a 
              href="/checkout"
              onclick={() => isOpen = false}
              class="py-3 px-3 bg-gradient-to-r from-cyber-600 to-neon-blue hover:from-cyber-500 hover:to-cyber-400 text-white text-xs font-bold rounded-xl text-center transition-all shadow-[0_0_15px_rgba(2,132,199,0.35)] flex items-center justify-center gap-1.5"
            >
              <span>Thanh toán ngay</span>
              <span>→</span>
            </a>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
