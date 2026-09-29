<script lang="ts">
  import { icons } from '../../icons';
  import { formatPrice } from '../../utils';
  import { cart } from '../../stores/cart';
  import { toasts } from '../../stores/toast';
  import type { Product } from '../../stores/products';
  import { goto } from '$app/navigation';
  
  let { product } = $props<{ product: Product }>();
  let adding = $state(false);
  
  async function handleAddToCart(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    
    adding = true;
    try {
      await cart.addItem(product.id, 1);
      toasts.add(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
    } catch (err) {
      toasts.add('Không thể thêm vào giỏ hàng', 'error');
    } finally {
      adding = false;
    }
  }

  async function handleBuyNow(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    
    adding = true;
    try {
      await cart.addItem(product.id, 1);
      goto('/checkout');
    } catch (err) {
      toasts.add('Không thể chuyển đến thanh toán', 'error');
    } finally {
      adding = false;
    }
  }
</script>

<a 
  href={`/product/${product.id}`}
  class="flex flex-col h-full relative bg-dark-900/60 rounded-2xl border border-white/10 overflow-hidden hover:border-cyber-500/40 transition-all hover:shadow-[0_4px_20px_rgba(2,132,199,0.15)] group"
>
  <!-- Image container -->
  <div class="relative w-full pt-[100%] bg-white/5 p-4 overflow-hidden shrink-0 flex items-center justify-center">
    {#if product.badge}
      <div class="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
        {product.badge}
      </div>
    {/if}
    
    <div class="absolute top-3 right-3 z-10">
      <button 
        type="button"
        onclick={(e) => { e.preventDefault(); e.stopPropagation(); toasts.add(`Đã lưu ${product.name} vào danh sách yêu thích`, 'info'); }}
        class="w-8 h-8 rounded-full bg-dark-950/70 backdrop-blur-sm flex items-center justify-center text-dark-300 hover:text-red-500 transition-colors border border-white/10 hover:border-red-500/30" 
        aria-label="Yêu thích"
      >
        <div class="w-4 h-4">{@html icons.heart}</div>
      </button>
    </div>
    
    <img 
      src={product.image_url || '/placeholder.png'} 
      alt={product.name}
      class="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-contain group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  </div>
  
  <!-- Content (Flex-1 ensures cards stretch and buttons align at bottom) -->
  <div class="p-4 sm:p-5 flex-1 flex flex-col justify-between">
    <div>
      <!-- Product Name: Fixed 2-line height for uniform card alignment -->
      <h3 class="text-white font-medium text-base line-clamp-2 leading-snug h-11 hover:text-cyber-400 transition-colors">
        {product.name}
      </h3>
      
      <!-- Price -->
      <div class="flex items-baseline gap-2 mt-2">
        <span class="text-neon-blue font-bold text-lg">{formatPrice(product.price)}</span>
        {#if product.original_price && product.original_price > product.price}
          <span class="text-dark-400 text-xs sm:text-sm line-through">{formatPrice(product.original_price)}</span>
        {/if}
      </div>
      
      <!-- Chip & Specs tags (Fixed height h-[56px] so 2 lines fit and no card pushes buttons out of alignment) -->
      <div class="flex flex-wrap gap-1.5 h-[56px] overflow-hidden content-start my-3">
        {#if product.chip}
          <span class="text-[11px] font-medium text-cyber-300 bg-cyber-500/10 px-2 py-0.5 rounded border border-cyber-500/20">{product.chip}</span>
        {/if}
        {#if product.specs && Array.isArray(product.specs)}
          {#each product.specs as spec}
            <span class="text-[11px] text-dark-300 bg-dark-800/80 px-2 py-0.5 rounded border border-white/5">{spec}</span>
          {/each}
        {/if}
      </div>
    </div>
    
    <!-- Action Buttons Row (Always perfectly aligned at bottom) -->
    <div class="mt-auto pt-2 grid grid-cols-2 gap-2">
      <!-- Add to Cart Button -->
      <button 
        type="button"
        onclick={handleAddToCart}
        disabled={(product.stock === 0 || product.stock_quantity === 0) || adding}
        class="w-full bg-cyber-600/20 hover:bg-cyber-600 text-cyber-300 hover:text-white border border-cyber-500/30 hover:border-cyber-500 font-medium py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Thêm vào giỏ hàng"
      >
        <div class="w-4 h-4 shrink-0">{@html icons.cart}</div>
        <span class="truncate">{adding ? 'Đang thêm...' : 'Thêm giỏ'}</span>
      </button>

      <!-- Buy Now Button -->
      <button 
        type="button"
        onclick={handleBuyNow}
        disabled={(product.stock === 0 || product.stock_quantity === 0) || adding}
        class="w-full bg-gradient-to-r from-neon-orange to-cyber-500 hover:from-orange-500 hover:to-cyber-400 text-white font-semibold py-2 px-2 rounded-xl transition-all shadow-[0_0_12px_rgba(251,146,60,0.25)] hover:shadow-[0_0_16px_rgba(251,146,60,0.45)] flex items-center justify-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Mua ngay"
      >
        <span class="truncate">Mua ngay</span>
        <span class="text-xs font-bold">→</span>
      </button>
    </div>
  </div>
</a>
