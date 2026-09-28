<script lang="ts">
  import { cart, cartTotal } from '$lib/stores/cart';
  import { formatPrice } from '$lib/utils';
  import { icons } from '$lib/icons';
  
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

<div class="container mx-auto px-4 py-12 max-w-6xl">
  <h1 class="text-3xl font-bold text-white mb-8 flex items-center gap-3">
    <div class="w-8 h-8 text-cyber-500">{@html icons.shoppingBag}</div>
    Giỏ hàng của bạn
  </h1>

  {#if cartItems.length === 0}
    <div class="bg-dark-900/50 rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center">
      <div class="w-24 h-24 text-dark-600 mb-6">{@html icons.cart}</div>
      <h2 class="text-xl font-semibold text-white mb-2">Giỏ hàng trống</h2>
      <p class="text-dark-400 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
      <a href="/" class="bg-cyber-600 hover:bg-cyber-500 text-white font-medium py-3 px-8 rounded-lg transition-colors">
        Tiếp tục mua sắm
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Cart Items -->
      <div class="lg:col-span-2 flex flex-col gap-4">
        {#each cartItems as item (item.id)}
          <div class="bg-dark-900/50 rounded-2xl border border-white/5 p-4 flex flex-col sm:flex-row gap-6 relative group">
            <a href={`/product/${item.product_id}`} class="w-28 h-28 shrink-0 bg-white/5 rounded-xl p-2 block mx-auto sm:mx-0">
              <img 
                src={item.product?.image_url || item.image_url || '/placeholder.png'} 
                alt={item.product?.name || item.name} 
                class="w-full h-full object-contain hover:scale-105 transition-transform"
              />
            </a>
            
            <div class="flex-1 flex flex-col">
              <div class="flex justify-between items-start gap-4">
                <a href={`/product/${item.product_id}`} class="text-base font-semibold text-white hover:text-cyber-400 transition-colors line-clamp-2">
                  {item.product?.name || item.name}
                </a>
                <button 
                  onclick={() => removeItem(item.id)}
                  class="w-8 h-8 flex items-center justify-center text-dark-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0"
                  title="Xóa"
                >
                  <div class="w-5 h-5">{@html icons.trash}</div>
                </button>
              </div>
              
              <div class="text-neon-blue font-bold text-base mt-1 mb-4">
                {formatPrice(item.product?.price ?? item.price ?? 0)}
              </div>
              
              <div class="mt-auto flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center bg-dark-800 rounded-lg border border-white/10 w-fit text-sm">
                  <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-dark-700 transition-colors rounded-l-lg" onclick={() => updateQuantity(item.id, item.quantity, -1)}>-</button>
                  <span class="w-10 text-center text-white font-medium">{item.quantity}</span>
                  <button class="w-8 h-8 flex items-center justify-center text-white hover:bg-dark-700 transition-colors rounded-r-lg" onclick={() => updateQuantity(item.id, item.quantity, 1)}>+</button>
                </div>
                
                <div class="text-right">
                  <span class="text-dark-400 text-xs">Thành tiền: </span>
                  <span class="text-white font-bold text-sm">{formatPrice((item.product?.price ?? item.price ?? 0) * item.quantity)}</span>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Order Summary -->
      <div>
        <div class="bg-dark-900/50 rounded-2xl border border-white/5 p-6 sticky top-24 space-y-4">
          <h3 class="text-lg font-semibold text-white border-b border-white/5 pb-4">Tóm tắt đơn hàng</h3>
          
          <div class="flex flex-col gap-3 text-sm">
            <div class="flex justify-between text-dark-300">
              <span>Tạm tính</span>
              <span class="text-white font-medium">{formatPrice(total)}</span>
            </div>
            <div class="flex justify-between text-dark-300">
              <span>Phí vận chuyển</span>
              <span class="text-emerald-400 font-medium">Miễn phí</span>
            </div>
          </div>
          
          <div class="border-t border-white/5 pt-4">
            <div class="flex justify-between items-baseline">
              <span class="text-white font-medium">Tổng thanh toán</span>
              <span class="text-2xl font-extrabold text-neon-blue">{formatPrice(total)}</span>
            </div>
          </div>
          
          <a 
            href="/checkout" 
            class="w-full bg-gradient-to-r from-cyber-600 to-neon-blue hover:from-cyber-500 hover:to-cyber-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(2,132,199,0.35)] flex items-center justify-center gap-2"
          >
            <span>Tiến hành đặt hàng</span>
            <span>→</span>
          </a>
          
          <div class="pt-2 flex items-center justify-center gap-2 text-dark-400 text-xs">
            <div class="w-4 h-4">{@html icons.shield}</div>
            Bảo mật thanh toán 100%
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
