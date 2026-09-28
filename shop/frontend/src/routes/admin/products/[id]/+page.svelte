<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import ImageUploader from '$lib/components/admin/ImageUploader.svelte';

  let isNew = $derived(page.url.pathname === '/admin/products/new');
  let id = $derived(isNew ? null : page.url.pathname.split('/').pop());

  let formData = $state({
    name: '',
    price: 0,
    originalPrice: 0,
    categoryId: '',
    image: '',
    description: '',
    stock: 0,
    isActive: true,
    badge: '',
    chip: '',
    specs: '' // Will handle as string for textarea, convert to JSON array on save
  });

  let categories = $state([]);
  let loading = $state(!isNew);
  let saving = $state(false);

  onMount(async () => {
    try {
      const catsRes = await api.getCategories();
      categories = catsRes.data || [];

      if (!isNew && id) {
        const prodRes = await api.getProduct(id);
        const data = prodRes.data;
        formData = {
          ...data,
          specs: Array.isArray(data.specs) ? data.specs.join(', ') : (data.specs || '')
        };
      }
    } catch (error) {
      console.error(error);
      addToast('Lỗi khi tải dữ liệu', 'error');
    } finally {
      loading = false;
    }
  });

  async function handleSave() {
    saving = true;
    try {
      const payload = {
        ...formData,
        specs: formData.specs.split(',').map(s => s.trim()).filter(s => s)
      };

      if (isNew) {
        await api.createProduct(payload);
        addToast('Thêm sản phẩm thành công', 'success');
      } else {
        await api.updateProduct(id, payload);
        addToast('Cập nhật sản phẩm thành công', 'success');
      }
      goto('/admin/products');
    } catch (error) {
      console.error(error);
      addToast('Lỗi khi lưu sản phẩm', 'error');
    } finally {
      saving = false;
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="max-w-4xl">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <a href="/admin/products" class="p-2 bg-dark-800 hover:bg-dark-700 text-gray-400 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </a>
        <h2 class="text-2xl font-bold text-white">{isNew ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h2>
      </div>
    </div>

    <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left column -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Thông tin cơ bản</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Tên sản phẩm *</label>
                <input required type="text" bind:value={formData.name} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Giá bán (VNĐ) *</label>
                  <input required type="number" bind:value={formData.price} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Giá gốc (VNĐ)</label>
                  <input type="number" bind:value={formData.originalPrice} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Mô tả</label>
                <textarea bind:value={formData.description} rows="4" class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500"></textarea>
              </div>
            </div>
          </div>

          <div class="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Thông số & Nhãn</h3>
            
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Badge (Góc trái)</label>
                  <input type="text" bind:value={formData.badge} placeholder="VD: Trợ giá sốc" class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-400 mb-1">Chip (Góc phải)</label>
                  <input type="text" bind:value={formData.chip} placeholder="VD: Thu cũ" class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Cấu hình (cách nhau bằng dấu phẩy)</label>
                <textarea bind:value={formData.specs} placeholder="VD: 6.7 inch, 8GB, 256GB" class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500"></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Right column -->
        <div class="space-y-6">
          <div class="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Hình ảnh</h3>
            <ImageUploader currentImage={formData.image} onUpload={(url) => formData.image = url} />
          </div>

          <div class="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 class="text-lg font-semibold text-white mb-4">Phân loại & Tồn kho</h3>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Danh mục *</label>
                <select required bind:value={formData.categoryId} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500">
                  <option value="">Chọn danh mục</option>
                  {#each categories as cat}
                    <option value={cat.id}>{cat.name}</option>
                  {/each}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-400 mb-1">Tồn kho</label>
                <input required type="number" bind:value={formData.stock} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
              </div>

              <div class="flex items-center gap-3 pt-2">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" bind:checked={formData.isActive} class="sr-only peer">
                  <div class="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  <span class="ml-3 text-sm font-medium text-gray-300">Đang bán</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-4 pt-4">
        <a href="/admin/products" class="px-6 py-2.5 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl font-medium transition-colors">
          Hủy
        </a>
        <button type="submit" disabled={saving} class="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-70 flex items-center gap-2">
          {#if saving}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {/if}
          Lưu sản phẩm
        </button>
      </div>
    </form>
  </div>
{/if}
