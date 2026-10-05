<script lang="ts">
  import HeroSection from '$lib/components/ui/HeroSection.svelte';
  import ProductCard from '$lib/components/ui/ProductCard.svelte';
  import { productsStore, filteredProducts, searchQuery } from '$lib/stores/products';
  import { icons } from '$lib/icons';
  import { onMount } from 'svelte';
  
  onMount(() => {
    productsStore.loadCategories();
    productsStore.loadProducts();
  });
</script>

<HeroSection />

<div class="container mx-auto px-4 lg:px-8 py-16" id="products">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 text-cyber-500 bg-cyber-500/10 rounded-lg p-1.5 border border-cyber-500/20">
        {@html icons.fire}
      </div>
      <h2 class="text-3xl font-bold text-white tracking-tight">Sản phẩm nổi bật</h2>
    </div>

    <!-- Live Search Box on Homepage -->
    <div class="relative w-full md:w-80">
      <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
        <div class="w-4 h-4">{@html icons.search}</div>
      </div>
      <input 
        type="text"
        placeholder="Tìm kiếm máy, chip, phụ kiện..."
        bind:value={$searchQuery}
        class="w-full pl-10 pr-9 py-2 bg-dark-900/90 border border-white/10 hover:border-white/20 focus:border-cyber-500 rounded-xl text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-all shadow-inner"
      />
      {#if $searchQuery}
        <button 
          type="button"
          onclick={() => searchQuery.set('')}
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-white transition-colors cursor-pointer"
          title="Xóa tìm kiếm"
        >
          <div class="w-4 h-4">{@html icons.close}</div>
        </button>
      {/if}
    </div>
  </div>

  <!-- Search Result Banner -->
  {#if $searchQuery}
    <div class="flex items-center justify-between bg-cyber-950/40 border border-cyber-500/30 rounded-xl px-4 py-2.5 mb-6 text-sm">
      <div class="flex items-center gap-2 text-cyber-300">
        <div class="w-4 h-4">{@html icons.search}</div>
        <span>Kết quả tìm kiếm cho: <strong class="text-white">"{$searchQuery}"</strong> (Tìm thấy <strong class="text-white">{$filteredProducts.length}</strong> sản phẩm)</span>
      </div>
      <button 
        onclick={() => { searchQuery.set(''); productsStore.setCategory(null); }}
        class="text-xs text-cyber-400 hover:text-cyber-200 underline font-medium cursor-pointer"
      >
        Xóa tìm kiếm
      </button>
    </div>
  {/if}
  
  <!-- Category Filter -->
  <div class="flex overflow-x-auto pb-4 mb-8 gap-3 custom-scrollbar">
    <button 
      class="px-5 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all border {$productsStore.selectedCategory === null ? 'bg-cyber-600 border-cyber-500 text-white shadow-[0_0_10px_rgba(2,132,199,0.4)]' : 'bg-dark-900 border-white/10 text-dark-300 hover:text-white hover:border-white/30'}"
      onclick={() => productsStore.setCategory(null)}
    >
      Tất cả
    </button>
    {#each $productsStore.categories as category}
      <button 
        class="px-5 py-2 rounded-full whitespace-nowrap font-medium text-sm transition-all border {$productsStore.selectedCategory === category.id ? 'bg-cyber-600 border-cyber-500 text-white shadow-[0_0_10px_rgba(2,132,199,0.4)]' : 'bg-dark-900 border-white/10 text-dark-300 hover:text-white hover:border-white/30'}"
        onclick={() => productsStore.setCategory(category.id)}
      >
        {category.name}
      </button>
    {/each}
  </div>
  
  <!-- Products Grid -->
  {#if $productsStore.loading}
    <div class="flex justify-center items-center py-20">
      <div class="w-10 h-10 border-4 border-cyber-500/30 border-t-cyber-500 rounded-full animate-spin"></div>
    </div>
  {:else if $filteredProducts.length === 0}
    <div class="text-center py-20 bg-dark-900/30 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
      <div class="w-16 h-16 mx-auto text-dark-600 mb-4">{@html icons.search}</div>
      <p class="text-white font-medium mb-1">Không tìm thấy sản phẩm nào phù hợp</p>
      {#if $searchQuery}
        <p class="text-dark-400 text-sm mb-4">Không có kết quả nào cho "{$searchQuery}"</p>
        <button 
          onclick={() => { searchQuery.set(''); productsStore.setCategory(null); }}
          class="px-4 py-2 bg-cyber-600 hover:bg-cyber-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-cyber-600/20 cursor-pointer"
        >
          Xem tất cả sản phẩm
        </button>
      {:else}
        <p class="text-dark-400 text-sm">Vui lòng thử chọn danh mục khác.</p>
      {/if}
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {#each $filteredProducts as product}
        <ProductCard {product} />
      {/each}
    </div>
  {/if}
</div>

<!-- Features Section -->
<div class="bg-dark-900/50 border-y border-white/5 py-16 mt-10">
  <div class="container mx-auto px-4 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div class="flex flex-col items-center text-center gap-4">
        <div class="w-16 h-16 bg-cyber-500/10 text-cyber-400 rounded-2xl flex items-center justify-center">
          <div class="w-8 h-8">{@html icons.truck}</div>
        </div>
        <h3 class="text-white font-semibold">Giao hàng siêu tốc</h3>
        <p class="text-dark-400 text-sm">Giao hàng toàn quốc nhanh chóng, an toàn</p>
      </div>
      <div class="flex flex-col items-center text-center gap-4">
        <div class="w-16 h-16 bg-neon-blue/10 text-neon-blue rounded-2xl flex items-center justify-center">
          <div class="w-8 h-8">{@html icons.shield}</div>
        </div>
        <h3 class="text-white font-semibold">Bảo hành chính hãng</h3>
        <p class="text-dark-400 text-sm">Cam kết 100% hàng chính hãng</p>
      </div>
      <div class="flex flex-col items-center text-center gap-4">
        <div class="w-16 h-16 bg-neon-purple/10 text-neon-purple rounded-2xl flex items-center justify-center">
          <div class="w-8 h-8">{@html icons.refresh}</div>
        </div>
        <h3 class="text-white font-semibold">Đổi trả dễ dàng</h3>
        <p class="text-dark-400 text-sm">1 đổi 1 trong 30 ngày nếu có lỗi NSX</p>
      </div>
      <div class="flex flex-col items-center text-center gap-4">
        <div class="w-16 h-16 bg-neon-pink/10 text-neon-pink rounded-2xl flex items-center justify-center">
          <div class="w-8 h-8">{@html icons.help}</div>
        </div>
        <h3 class="text-white font-semibold">Hỗ trợ 24/7</h3>
        <p class="text-dark-400 text-sm">Đội ngũ tư vấn nhiệt tình, chuyên nghiệp</p>
      </div>
    </div>
  </div>
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
