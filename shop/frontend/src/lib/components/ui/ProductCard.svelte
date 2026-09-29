<script lang="ts">
  import { icons } from '../../icons';
  import { formatPrice } from '../../utils';
  import { cart } from '../../stores/cart';
  import { toasts } from '../../stores/toast';
  import { goto } from '$app/navigation';
  import type { Product } from '../../stores/products';
  
  let { product } = $props<{ product: Product }>();
  let adding = $state(false);
  let buying = $state(false);
  
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
    if (buying) return;

    buying = true;
    try {
      await cart.addItem(product.id, 1);
      goto('/checkout');
    } catch (err) {
      toasts.add('Không thể xử lý đơn hàng', 'error');
    } finally {
      buying = false;
    }
  }
</script>

<a 
  href={`/product/${product.id}`}
  class="relative bg-dark-900/60 rounded-2xl border border-white/10 overflow-hidden hover:border-cyber-500/40 transition-colors h-full flex flex-col group"
>
  <!-- Image container -->
  <div class="relative w-full pt-[100%] bg-white/5 p-4 overflow-hidden flex items-center justify-center shrink-0">
    {#if product.badge}
      <div class="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow">
        {product.badge}
      </div>
    {/if}
    
    <div class="absolute top-3 right-3 z-10">
      <button 
        type="button"
        onclick={(e) => { e.preventDefault(); e.stopPropagation(); toasts.add(`Đã lưu ${product.name} vào danh sách yêu thích`, 'info'); }}
        class="w-8 h-8 rounded-full bg-dark-950/60 flex items-center justify-center text-dark-300 hover:text-red-500 transition-colors border border-white/10" 
        aria-label="Yêu thích"
      >
        <div class="w-4 h-4">{@html icons.heart}</div>
      </button>
    </div>
    
    <img 
      src={product.image_url || '/placeholder.png'} 
      alt={product.name}
      class="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] object-contain"
      loading="lazy"
    />
  </div>
  
  <!-- Content: flex-1 ensures footer buttons align perfectly across rows -->
  <div class="p-4 sm:p-5 flex flex-col flex-1 gap-2">
    <!-- Title: fixed 2-line height for horizontal symmetry -->
    <h3 class="text-white font-medium text-sm sm:text-base line-clamp-2 leading-snug hover:text-cyber-400 transition-colors h-11">
      {product.name}
    </h3>
    
    <!-- Price -->
    <div class="flex items-baseline gap-2 h-7">
      <span class="text-neon-blue font-bold text-base sm:text-lg">{formatPrice(product.price)}</span>
      {#if product.original_price && product.original_price > product.price}
        <span class="text-dark-400 text-xs sm:text-sm line-through">{formatPrice(product.original_price)}</span>
      {/if}
    </div>
    
    <!-- Chip & Specs tags: fixed height to prevent card height misalignment -->
    <div class="flex flex-wrap gap-1.5 my-1 h-[56px] overflow-hidden content-start">
      {#if product.chip}
        <span class="text-[11px] font-medium text-cyber-300 bg-cyber-500/10 px-2 py-0.5 rounded border border-cyber-500/20">{product.chip}</span>
      {/if}
      {#if product.specs && Array.isArray(product.specs)}
        {#each product.specs as spec}
          <span class="text-[11px] text-dark-300 bg-dark-800/80 px-2 py-0.5 rounded border border-white/5">{spec}</span>
        {/each}
      {/if}
    </div>
    
    <!-- Actions Row: mt-auto guarantees all buttons sit at the exact same baseline -->
    <div class="mt-auto pt-3 grid grid-cols-2 gap-2">
      <!-- Add to cart button -->
      <button 
        type="button"
        onclick={handleAddToCart}
        disabled={(product.stock === 0 || product.stock_quantity === 0) || adding}
        class="w-full bg-cyber-500/10 hover:bg-cyber-500/20 text-cyber-400 hover:text-white border border-cyber-500/30 hover:border-cyber-500 font-medium py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        title="Thêm vào giỏ hàng"
      >
        <div class="w-3.5 h-3.5 shrink-0">{@html icons.cart}</div>
        <span class="truncate">{adding ? 'Đang thêm...' : (product.stock === 0 || product.stock_quantity === 0) ? 'Hết hàng' : 'Thêm giỏ'}</span>
      </button>

      <!-- Buy now button -->
      <button 
        type="button"
        onclick={handleBuyNow}
        disabled={(product.stock === 0 || product.stock_quantity === 0) || buying}
        class="w-full bg-gradient-to-r from-cyber-600 to-neon-blue hover:from-cyber-500 hover:to-cyber-400 text-white font-semibold py-2 px-2 rounded-xl transition-all shadow-[0_0_12px_rgba(2,132,199,0.3)] flex items-center justify-center gap-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
        title="Mua ngay"
      >
        <span>{buying ? 'Đang mua...' : 'Mua ngay'}</span>
        <span class="text-xs">→</span>
      </button>
    </div>
  </div>
</a>
