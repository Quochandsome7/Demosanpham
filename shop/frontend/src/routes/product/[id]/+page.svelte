<script lang="ts">
  import { icons } from '$lib/icons';
  import { formatPrice } from '$lib/utils';
  import { cart } from '$lib/stores/cart';
  import { toasts } from '$lib/stores/toast';
  import ProductCard from '$lib/components/ui/ProductCard.svelte';
  
  let { data } = $props();
  let product = $derived(data.product);
  let relatedProducts = $derived(data.relatedProducts);
  
  let quantity = $state(1);
  let adding = $state(false);
  
  async function handleAddToCart() {
    if (!product || product.stock_quantity === 0 || adding) return;
    
    adding = true;
    try {
      await cart.addItem(product.id, quantity);
      toasts.add(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`, 'success');
    } catch (err) {
      toasts.add('Không thể thêm vào giỏ hàng', 'error');
    } finally {
      adding = false;
    }
  }
  
  function increment() {
    if (quantity < (product?.stock_quantity || 1)) quantity++;
  }
  
  function decrement() {
    if (quantity > 1) quantity--;
  }
</script>

<div class="container mx-auto px-4 py-8 lg:py-12">
  <a href="/" class="inline-flex items-center gap-2 text-dark-400 hover:text-cyber-400 transition-colors mb-8">
    <div class="w-5 h-5">{@html icons.arrowLeft}</div>
    <span>Trở về trang chủ</span>
  </a>

  {#if !product}
    <div class="text-center py-20 text-white">
      <h1 class="text-2xl font-bold mb-4">Sản phẩm không tồn tại</h1>
      <p class="text-dark-400">Có thể sản phẩm đã bị xóa hoặc đường dẫn không đúng.</p>
    </div>
  {:else}
    <div class="bg-dark-900/50 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm p-6 lg:p-10">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        
        <!-- Image Gallery -->
        <div class="flex flex-col gap-4">
          <div class="relative w-full pt-[100%] bg-white/5 rounded-2xl flex items-center justify-center p-8 overflow-hidden group">
            {#if product.badge}
              <div class="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                {product.badge}
              </div>
            {/if}
            <img 
              src={product.image_url || '/placeholder.png'} 
              alt={product.name}
              class="absolute inset-8 w-[calc(100%-4rem)] h-[calc(100%-4rem)] object-contain"
            />
          </div>
        </div>
        
        <!-- Product Info -->
        <div class="flex flex-col">
          <h1 class="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">{product.name}</h1>
          
          <div class="flex items-center gap-4 mb-6">
            <div class="flex items-center gap-1 text-yellow-400">
              <div class="w-4 h-4">{@html icons.heartFilled}</div>
              <span class="text-sm font-medium ml-1">4.9</span>
            </div>
            <div class="w-1 h-1 rounded-full bg-dark-600"></div>
            <span class="text-dark-400 text-sm">128 Đánh giá</span>
            <div class="w-1 h-1 rounded-full bg-dark-600"></div>
            <div class="flex items-center gap-2">
              {#if product.stock_quantity > 0}
                <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span class="text-green-500 text-sm font-medium">Còn hàng</span>
              {:else}
                <div class="w-2 h-2 rounded-full bg-red-500"></div>
                <span class="text-red-500 text-sm font-medium">Hết hàng</span>
              {/if}
            </div>
          </div>
          
          <div class="flex items-end gap-4 mb-8 bg-dark-950/50 p-6 rounded-2xl border border-white/5 inline-block">
            <span class="text-3xl lg:text-4xl font-bold text-neon-blue tracking-tight">{formatPrice(product.price)}</span>
            {#if product.original_price && product.original_price > product.price}
              <span class="text-dark-400 text-xl line-through mb-1">{formatPrice(product.original_price)}</span>
              <span class="bg-red-500/20 text-red-500 px-2 py-1 rounded text-sm font-semibold ml-2 mb-1">
                -{Math.round((1 - product.price / product.original_price) * 100)}%
              </span>
            {/if}
          </div>
          
          {#if product.specs}
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-white mb-4">Cấu hình nổi bật</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {#if Array.isArray(product.specs)}
                  {#each product.specs as item}
                    <div class="flex items-center gap-3 bg-dark-800/50 p-3 rounded-lg border border-white/5">
                      <div class="w-5 h-5 text-cyber-500 shrink-0">{@html icons.check}</div>
                      <div class="text-white text-sm font-medium">{item}</div>
                    </div>
                  {/each}
                {:else}
                  {#each Object.entries(product.specs) as [key, val]}
                    <div class="flex items-start gap-3 bg-dark-800/50 p-3 rounded-lg border border-white/5">
                      <div class="w-5 h-5 text-cyber-500 mt-0.5 shrink-0">{@html icons.check}</div>
                      <div>
                        <div class="text-dark-400 text-xs capitalize mb-1">{key}</div>
                        <div class="text-white text-sm font-medium">{val}</div>
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
            </div>
          {/if}
          
          <div class="mb-8">
            <h3 class="text-lg font-semibold text-white mb-3">Mô tả sản phẩm</h3>
            <div class="prose prose-invert prose-sm max-w-none text-dark-300 leading-relaxed whitespace-pre-line bg-dark-900/40 p-5 rounded-xl border border-white/5">
              {product.description || 'Chưa có mô tả cho sản phẩm này.'}
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-4 mt-auto">
            <div class="flex items-center bg-dark-800 rounded-xl border border-white/10 p-1 w-fit">
              <button class="w-10 h-10 flex items-center justify-center text-white hover:bg-dark-700 rounded-lg transition-colors" onclick={decrement}>-</button>
              <input type="number" bind:value={quantity} min="1" max={product.stock_quantity} class="w-12 text-center bg-transparent text-white font-medium outline-none no-arrows" />
              <button class="w-10 h-10 flex items-center justify-center text-white hover:bg-dark-700 rounded-lg transition-colors" onclick={increment}>+</button>
            </div>
            
            <button 
              onclick={handleAddToCart}
              disabled={product.stock_quantity === 0 || adding}
              class="flex-1 bg-gradient-to-r from-cyber-600 to-neon-blue hover:from-cyber-500 hover:to-cyber-400 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(2,132,199,0.3)] hover:shadow-[0_0_30px_rgba(2,132,199,0.5)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div class="absolute inset-0 w-[20%] h-full bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[sweep_1.5s_ease-in-out_infinite]"></div>
              <div class="w-5 h-5">{@html icons.cart}</div>
              <span>{adding ? 'Đang thêm...' : product.stock_quantity === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
            </button>
          </div>
          
        </div>
      </div>
    </div>
    
    {#if relatedProducts && relatedProducts.length > 0}
      <div class="mt-20">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-8 h-8 text-cyber-500 bg-cyber-500/10 rounded-lg p-1.5 border border-cyber-500/20">
            {@html icons.box}
          </div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Sản phẩm liên quan</h2>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {#each relatedProducts.filter(p => p.id !== product.id).slice(0, 4) as related}
            <ProductCard product={related} />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .no-arrows::-webkit-outer-spin-button,
  .no-arrows::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
