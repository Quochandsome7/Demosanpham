<script lang="ts">
  import { icons } from '../../icons';
  import { formatPrice } from '../../utils';
  import { cart } from '../../stores/cart';
  import { toasts } from '../../stores/toast';
  import type { Product } from '../../stores/products';
  
  let { product } = $props<{ product: Product }>();
  let adding = $state(false);
  
  async function handleAddToCart(e: Event) {
    e.preventDefault();
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
</script>

<a 
  href={`/product/${product.id}`}
  class="block relative bg-dark-900/60 rounded-2xl border border-white/10 overflow-hidden hover:border-cyber-500/40 transition-colors"
>
  <!-- Image container (static, no zoom, no tilt) -->
  <div class="relative w-full pt-[100%] bg-white/5 p-4 overflow-hidden flex items-center justify-center">
    {#if product.badge}
      <div class="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
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
  
  <!-- Content -->
  <div class="p-5 flex flex-col gap-2 min-h-[200px]">
    <h3 class="text-white font-medium text-base line-clamp-2 leading-snug hover:text-cyber-400 transition-colors">
      {product.name}
    </h3>
    
    <div class="flex items-end gap-2 mt-1">
      <span class="text-neon-blue font-bold text-lg">{formatPrice(product.price)}</span>
      {#if product.original_price && product.original_price > product.price}
        <span class="text-dark-400 text-sm line-through mb-[2px]">{formatPrice(product.original_price)}</span>
      {/if}
    </div>
    
    <!-- Chip & Specs tags -->
    <div class="flex flex-wrap gap-1.5 my-1">
      {#if product.chip}
        <span class="text-[11px] font-medium text-cyber-300 bg-cyber-500/10 px-2 py-0.5 rounded border border-cyber-500/20">{product.chip}</span>
      {/if}
      {#if product.specs && Array.isArray(product.specs)}
        {#each product.specs as spec}
          <span class="text-[11px] text-dark-300 bg-dark-800/80 px-2 py-0.5 rounded border border-white/5">{spec}</span>
        {/each}
      {/if}
    </div>
    
    <div class="mt-auto pt-2">
      <!-- Add to cart button (clean, static, no laser animation) -->
      <button 
        type="button"
        onclick={handleAddToCart}
        disabled={(product.stock === 0 || product.stock_quantity === 0) || adding}
        class="w-full bg-cyber-600/20 hover:bg-cyber-600 text-cyber-400 hover:text-white border border-cyber-500/30 hover:border-cyber-500 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="w-4 h-4">{@html icons.cart}</div>
        <span class="text-sm">{adding ? 'Đang thêm...' : (product.stock === 0 || product.stock_quantity === 0) ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
      </button>
    </div>
  </div>
</a>
