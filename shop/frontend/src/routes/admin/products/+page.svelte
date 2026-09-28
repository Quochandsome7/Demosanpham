<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { formatPrice } from '$lib/utils';
  import { addToast } from '$lib/stores/toast';
  import DataTable from '$lib/components/admin/DataTable.svelte';

  let products = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');
  
  // Delete modal state
  let showDeleteModal = $state(false);
  let productToDelete = $state<any>(null);

  async function fetchProducts() {
    loading = true;
    try {
      const res = await api.getProducts({ search: searchQuery });
      products = res.data || [];
    } catch (error) {
      console.error(error);
      addToast('Lỗi khi tải danh sách sản phẩm', 'error');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchProducts();
  });

  function handleSearch(e: Event) {
    e.preventDefault();
    fetchProducts();
  }

  function confirmDelete(product: any) {
    productToDelete = product;
    showDeleteModal = true;
  }

  async function deleteProduct() {
    if (!productToDelete) return;
    
    try {
      await api.deleteProduct(productToDelete.id);
      addToast('Đã xóa sản phẩm thành công', 'success');
      showDeleteModal = false;
      productToDelete = null;
      fetchProducts();
    } catch (error) {
      console.error(error);
      addToast('Lỗi khi xóa sản phẩm', 'error');
    }
  }

  const columns = [
    { 
      key: 'image', 
      label: 'Hình ảnh',
      render: (row: any) => `<img src="${row.image || '/placeholder.png'}" alt="${row.name}" class="w-12 h-12 object-cover rounded-lg bg-dark-800" />`
    },
    { 
      key: 'name', 
      label: 'Tên sản phẩm',
      render: (row: any) => `<div class="font-medium text-gray-200 line-clamp-2 max-w-xs">${row.name}</div>`
    },
    { 
      key: 'price', 
      label: 'Giá bán',
      render: (row: any) => `<div class="text-cyan-400 font-medium">${formatPrice(row.price)}</div>`
    },
    { key: 'categoryName', label: 'Danh mục' },
    { key: 'stock', label: 'Tồn kho' },
    { 
      key: 'isActive', 
      label: 'Trạng thái',
      render: (row: any) => row.isActive 
        ? `<span class="px-2.5 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Đang bán</span>` 
        : `<span class="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Ngừng bán</span>`
    },
    { 
      key: 'actions', 
      label: 'Thao tác',
      render: (row: any) => `
        <div class="flex items-center gap-2" onclick="event.stopPropagation()">
          <a href="/admin/products/${row.id}" class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </a>
          <button data-id="${row.id}" class="delete-btn p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <svg class="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      `
    }
  ];

  // Global event listener for delete buttons in table
  $effect(() => {
    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.delete-btn');
      if (btn) {
        const id = btn.getAttribute('data-id');
        const p = products.find((p: any) => p.id == id);
        if (p) confirmDelete(p);
      }
    };
    document.addEventListener('click', handleTableClick);
    return () => document.removeEventListener('click', handleTableClick);
  });
</script>

<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
  <form onsubmit={handleSearch} class="relative w-full sm:w-96">
    <input 
      type="text" 
      bind:value={searchQuery}
      placeholder="Tìm kiếm sản phẩm..." 
      class="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-gray-500"
    />
    <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
  </form>

  <a href="/admin/products/new" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/20">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
    Thêm sản phẩm
  </a>
</div>

<DataTable 
  {columns} 
  data={products} 
  {loading} 
  onRowClick={(row) => goto(`/admin/products/${row.id}`)}
/>

{#if showDeleteModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div class="bg-dark-900 border border-dark-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <h3 class="text-xl font-semibold text-white mb-2">Xác nhận xóa</h3>
      <p class="text-gray-400 text-sm mb-6">Bạn có chắc chắn muốn xóa sản phẩm <span class="text-white font-medium">"{productToDelete?.name}"</span>? Hành động này không thể hoàn tác.</p>
      <div class="flex justify-end gap-3">
        <button 
          onclick={() => showDeleteModal = false}
          class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl text-sm font-medium transition-colors"
        >
          Hủy
        </button>
        <button 
          onclick={deleteProduct}
          class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  </div>
{/if}
