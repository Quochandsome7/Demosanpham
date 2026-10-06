<script lang="ts">
  import { onMount } from 'svelte';
  import { icons } from '$lib/icons';
  import { formatPrice } from '$lib/utils';
  import { wishlistStore } from '$lib/stores/wishlist';
  import { cart } from '$lib/stores/cart';
  import { toasts } from '$lib/stores/toast';
  import { goto } from '$app/navigation';

  onMount(() => {
    wishlistStore.loadWishlist();
  });

  async function handleRemove(e: Event, productId: number, productName: string) {
    e.preventDefault();
    e.stopPropagation();
    await wishlistStore.removeFromWishlist(productId);
    toasts.add(`Đã xóa ${productName} khỏi yêu thích`, 'info');
  }

  async function handleBuyNow(e: Event, productId: number) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await cart.addItem(productId, 1);
      goto('/checkout');
    } catch (err) {
      toasts.add('Không thể chuyển đến thanh toán', 'error');
    }
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
  <div class="flex items-center gap-3 mb-8">
    <div class="text-red-500 w-8 h-8">
      {@html icons.heartFilled}
    </div>
    <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">Sản phẩm yêu thích</h1>
  </div>

  {#if $wishlistStore.loading}
    <div class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-500"></div>
    </div>
  {:else if $wishlistStore.items.length === 0}
    <div class="bg-dark-900/60 rounded-2xl border border-white/10 p-12 text-center flex flex-col items-center">
      <div class="w-20 h-20 text-dark-500 mb-6">
        {@html icons.heart}
      </div>
      <h2 class="text-xl text-white font-medium mb-3">Danh sách yêu thích trống</h2>
      <p class="text-dark-400 mb-8 max-w-md">Bạn chưa lưu sản phẩm nào vào danh sách yêu thích. Hãy khám phá các sản phẩm của chúng tôi và chọn những món đồ bạn thích nhé.</p>
      <a href="/" class="bg-cyber-600 hover:bg-cyber-500 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(2,132,199,0.3)]">
        Khám phá sản phẩm
      </a>
    </div>
  {:else}
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {#each $wishlistStore.items as item}
        <div class="flex flex-col h-full relative bg-dark-900/60 rounded-2xl border border-white/10 overflow-hidden hover:border-cyber-500/40 transition-all group">
          <a href={`/product/${item.product_id}`} class="relative w-full pt-[100%] bg-white/5 p-4 overflow-hidden shrink-0 flex items-center justify-center block">
            {#if item.badge}
              <div class="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                {item.badge}
              </div>
            {/if}
            <img 
              src={item.image_url || '/placeholder.png'} 
              alt={item.name}
              class="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </a>
          
          <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <a href={`/product/${item.product_id}`} class="block">
              <h3 class="text-white font-medium text-base line-clamp-2 leading-snug h-11 hover:text-cyber-400 transition-colors">
                {item.name}
              </h3>
              
              <div class="flex items-baseline gap-2 mt-2">
                <span class="text-neon-blue font-bold text-lg">{formatPrice(item.price)}</span>
                {#if item.original_price && item.original_price > item.price}
                  <span class="text-dark-400 text-xs sm:text-sm line-through">{formatPrice(item.original_price)}</span>
                {/if}
              </div>
              
              {#if item.stock === 0 || item.stock_quantity === 0}
                <div class="mt-2 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded inline-block">
                  Hết hàng
                </div>
              {:else}
                <div class="mt-2 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded inline-block">
                  Còn hàng
                </div>
              {/if}
            </a>
            
            <div class="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
              <button 
                type="button"
                onclick={(e) => handleRemove(e, item.product_id, item.name)}
                class="w-full bg-dark-800 hover:bg-red-500/20 text-dark-300 hover:text-red-500 border border-white/10 hover:border-red-500/30 font-medium py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer"
              >
                <div class="w-4 h-4 shrink-0">{@html icons.trash}</div>
                <span class="truncate">Xóa</span>
              </button>

              <button 
                type="button"
                onclick={(e) => handleBuyNow(e, item.product_id)}
                disabled={item.stock === 0 || item.stock_quantity === 0}
                class="w-full bg-gradient-to-r from-neon-orange to-cyber-500 hover:from-orange-500 hover:to-cyber-400 text-white font-semibold py-2 px-2 rounded-xl transition-all shadow-[0_0_12px_rgba(251,146,60,0.25)] hover:shadow-[0_0_16px_rgba(251,146,60,0.45)] flex items-center justify-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span class="truncate">Mua ngay</span>
                <span class="text-xs font-bold">→</span>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
