<script lang="ts">
  import HeroSection from '$lib/components/ui/HeroSection.svelte';
  import ProductCard from '$lib/components/ui/ProductCard.svelte';
  import { productsStore, filteredProducts, searchQuery } from '$lib/stores/products';
  import { icons } from '$lib/icons';
  import { onMount } from 'svelte';
  
  let minPrice = $state<number | null>(null);
  let maxPrice = $state<number | null>(null);
  let sortBy = $state('default');

  onMount(() => {
    productsStore.loadCategories();
    productsStore.loadProducts();
  });

  function clearAllFilters() {
    searchQuery.set('');
    productsStore.setCategory(null);
    minPrice = null;
    maxPrice = null;
    sortBy = 'default';
  }

  let hasActiveFilter = $derived(
    Boolean($searchQuery.trim()) ||
    $productsStore.selectedCategory !== null ||
    (minPrice !== null && minPrice > 0) ||
    (maxPrice !== null && maxPrice > 0) ||
    sortBy !== 'default'
  );

  let displayedProducts = $derived.by(() => {
    let list = $filteredProducts;

    // Filter price range
    if (minPrice !== null && minPrice > 0) {
      list = list.filter(p => p.price >= minPrice!);
    }
    if (maxPrice !== null && maxPrice > 0) {
      list = list.filter(p => p.price <= maxPrice!);
    }

    // Sort
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name_asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  });
</script>

<HeroSection />

<div class="container mx-auto px-4 lg:px-8 py-16" id="products">
  <div class="flex items-center gap-3 mb-6">
    <div class="w-8 h-8 text-cyber-500 bg-cyber-500/10 rounded-lg p-1.5 border border-cyber-500/20">
      {@html icons.fire}
    </div>
    <h2 class="text-3xl font-bold text-white tracking-tight">Sản phẩm nổi bật</h2>
  </div>

  <!-- BỘ LỌC VÀ TÌM KIẾM 1 HÀNG TRÊN DESKTOP: [Tìm kiếm] [Danh mục] [Khoảng giá] [Sắp xếp] [Xóa lọc / Tìm] -->
  <div class="bg-dark-900/80 border border-white/10 rounded-2xl p-3 sm:p-4 mb-6 shadow-xl backdrop-blur-md">
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      
      <!-- 1. [Tìm kiếm] -->
      <div class="relative flex-1 min-w-[200px]">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
          <div class="w-4 h-4">{@html icons.search}</div>
        </div>
        <input 
          type="text"
          placeholder="Tìm tên, thương hiệu, chip..."
          bind:value={$searchQuery}
          class="w-full pl-10 pr-9 py-2.5 bg-dark-950 border border-white/10 hover:border-white/20 focus:border-cyber-500 rounded-xl text-xs sm:text-sm text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-cyber-500/50 transition-all shadow-inner"
        />
        {#if $searchQuery}
          <button 
            type="button"
            onclick={() => searchQuery.set('')}
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-400 hover:text-white transition-colors cursor-pointer"
            title="Xóa từ khóa"
          >
            <div class="w-4 h-4">{@html icons.close}</div>
          </button>
        {/if}
      </div>

      <!-- 2. [Danh mục] -->
      <div class="shrink-0 w-full lg:w-44">
        <select
          value={$productsStore.selectedCategory ?? ''}
          onchange={(e) => {
            const val = (e.target as HTMLSelectElement).value;
            productsStore.setCategory(val ? Number(val) : null);
          }}
          class="w-full py-2.5 px-3 bg-dark-950 border border-white/10 hover:border-white/20 focus:border-cyber-500 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyber-500/50 cursor-pointer transition-all"
        >
          <option value="">Tất cả danh mục</option>
          {#each $productsStore.categories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>

      <!-- 3. [Khoảng giá] -->
      <div class="shrink-0 flex items-center gap-1.5 bg-dark-950 border border-white/10 rounded-xl px-2.5 py-1.5">
        <span class="text-[11px] text-dark-400 whitespace-nowrap">Giá:</span>
        <input 
          type="number"
          placeholder="Từ ₫"
          bind:value={minPrice}
          min="0"
          step="500000"
          class="w-20 sm:w-24 bg-transparent border-0 text-xs text-white placeholder-dark-500 focus:outline-none"
        />
        <span class="text-dark-500">-</span>
        <input 
          type="number"
          placeholder="Đến ₫"
          bind:value={maxPrice}
          min="0"
          step="500000"
          class="w-20 sm:w-24 bg-transparent border-0 text-xs text-white placeholder-dark-500 focus:outline-none"
        />
      </div>

      <!-- 4. [Sắp xếp] -->
      <div class="shrink-0 w-full lg:w-44">
        <select
          bind:value={sortBy}
          class="w-full py-2.5 px-3 bg-dark-950 border border-white/10 hover:border-white/20 focus:border-cyber-500 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyber-500/50 cursor-pointer transition-all"
        >
          <option value="default">Sắp xếp: Mặc định</option>
          <option value="price_asc">Giá: Thấp → Cao</option>
          <option value="price_desc">Giá: Cao → Thấp</option>
          <option value="name_asc">Tên: A → Z</option>
        </select>
      </div>

      <!-- 5. [Nút Tìm kiếm / Xóa lọc] -->
      <div class="shrink-0 flex items-center gap-2">
        {#if hasActiveFilter}
          <button 
            type="button"
            onclick={clearAllFilters}
            class="w-full lg:w-auto px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            title="Xóa tất cả bộ lọc"
          >
            <span>Xóa lọc</span>
            <span>✕</span>
          </button>
        {:else}
          <button 
            type="button"
            class="w-full lg:w-auto px-5 py-2.5 bg-cyber-600 hover:bg-cyber-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-cyber-600/20 whitespace-nowrap"
          >
            Tìm kiếm
          </button>
        {/if}
      </div>

    </div>

    <!-- Category quick pills -->
    <div class="flex overflow-x-auto pt-3 mt-3 border-t border-white/5 gap-2 custom-scrollbar">
      <button 
        class="px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-all border {$productsStore.selectedCategory === null ? 'bg-cyber-600 border-cyber-500 text-white shadow-[0_0_8px_rgba(2,132,199,0.4)]' : 'bg-dark-950 border-white/10 text-dark-300 hover:text-white hover:border-white/30 cursor-pointer'}"
        onclick={() => productsStore.setCategory(null)}
      >
        Tất cả ({$productsStore.products.length})
      </button>
      {#each $productsStore.categories as category}
        <button 
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium text-xs transition-all border {$productsStore.selectedCategory === category.id ? 'bg-cyber-600 border-cyber-500 text-white shadow-[0_0_8px_rgba(2,132,199,0.4)]' : 'bg-dark-950 border-white/10 text-dark-300 hover:text-white hover:border-white/30 cursor-pointer'}"
          onclick={() => productsStore.setCategory(category.id)}
        >
          {category.name}
        </button>
      {/each}
    </div>
  </div>

  <!-- Search / Filter Results Summary Banner -->
  {#if hasActiveFilter}
    <div class="flex items-center justify-between bg-cyber-950/40 border border-cyber-500/30 rounded-xl px-4 py-2.5 mb-6 text-sm">
      <div class="flex items-center gap-2 text-cyber-300 text-xs sm:text-sm">
        <div class="w-4 h-4">{@html icons.search}</div>
        <span>
          {#if $searchQuery}Từ khóa: <strong class="text-white">"{$searchQuery}"</strong> • {/if}
          Tìm thấy <strong class="text-white">{displayedProducts.length}</strong> sản phẩm phù hợp
        </span>
      </div>
      <button 
        onclick={clearAllFilters}
        class="text-xs text-cyber-400 hover:text-cyber-200 underline font-medium cursor-pointer"
      >
        Xóa bộ lọc
      </button>
    </div>
  {/if}
  
  <!-- Products Grid -->
  {#if $productsStore.loading}
    <div class="flex justify-center items-center py-20">
      <div class="w-10 h-10 border-4 border-cyber-500/30 border-t-cyber-500 rounded-full animate-spin"></div>
    </div>
  {:else if displayedProducts.length === 0}
    <div class="text-center py-20 bg-dark-900/30 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
      <div class="w-16 h-16 mx-auto text-dark-600 mb-4">{@html icons.search}</div>
      <p class="text-white font-medium mb-1">Không tìm thấy sản phẩm nào phù hợp</p>
      {#if hasActiveFilter}
        <p class="text-dark-400 text-sm mb-4">Vui lòng thử điều chỉnh khoảng giá hoặc từ khóa tìm kiếm</p>
        <button 
          onclick={clearAllFilters}
          class="px-4 py-2 bg-cyber-600 hover:bg-cyber-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-cyber-600/20 cursor-pointer"
        >
          Xem tất cả sản phẩm
        </button>
      {:else}
        <p class="text-dark-400 text-sm">Cửa hàng hiện đang cập nhật sản phẩm.</p>
      {/if}
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {#each displayedProducts as product}
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
