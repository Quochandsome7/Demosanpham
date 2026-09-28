<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import DataTable from '$lib/components/admin/DataTable.svelte';

  let categories = $state([]);
  let loading = $state(true);
  
  let showModal = $state(false);
  let showDeleteModal = $state(false);
  let isEditing = $state(false);
  let currentId = $state<any>(null);
  
  let formData = $state({
    name: '',
    slug: '',
    icon: ''
  });

  async function fetchCategories() {
    loading = true;
    try {
      const res = await api.getCategories();
      categories = res.data || [];
    } catch (error) {
      console.error(error);
      addToast('Lỗi khi tải danh mục', 'error');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchCategories();
  });

  // Auto generate slug
  $effect(() => {
    if (formData.name && !isEditing) {
      formData.slug = formData.name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
  });

  function openAddModal() {
    isEditing = false;
    formData = { name: '', slug: '', icon: '' };
    showModal = true;
  }

  function openEditModal(category: any) {
    isEditing = true;
    currentId = category.id;
    formData = { name: category.name, slug: category.slug, icon: category.icon || '' };
    showModal = true;
  }

  function confirmDelete(category: any) {
    currentId = category.id;
    showDeleteModal = true;
  }

  async function handleSave() {
    try {
      if (isEditing) {
        await api.updateCategory(currentId, formData);
        addToast('Cập nhật danh mục thành công', 'success');
      } else {
        await api.createCategory(formData);
        addToast('Thêm danh mục thành công', 'success');
      }
      showModal = false;
      fetchCategories();
    } catch (error) {
      addToast('Lỗi khi lưu danh mục', 'error');
    }
  }

  async function handleDelete() {
    try {
      await api.deleteCategory(currentId);
      addToast('Xóa danh mục thành công', 'success');
      showDeleteModal = false;
      fetchCategories();
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Lỗi khi xóa danh mục. Có thể danh mục đang chứa sản phẩm.', 'error');
      showDeleteModal = false;
    }
  }

  const columns = [
    { 
      key: 'icon', 
      label: 'Icon',
      render: (row: any) => row.icon ? `<div class="text-cyan-400" style="width:24px;height:24px">${row.icon}</div>` : '-'
    },
    { key: 'name', label: 'Tên danh mục', class: 'font-medium text-gray-200' },
    { key: 'slug', label: 'Slug', class: 'text-gray-400 text-sm' },
    { key: 'productCount', label: 'Số sản phẩm' },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (row: any) => `
        <div class="flex items-center gap-2">
          <button data-action="edit" data-id="${row.id}" class="action-btn p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">Sửa</button>
          <button data-action="delete" data-id="${row.id}" class="action-btn p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">Xóa</button>
        </div>
      `
    }
  ];

  $effect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('.action-btn');
      if (btn) {
        const action = btn.getAttribute('data-action');
        const id = btn.getAttribute('data-id');
        const cat = categories.find((c: any) => c.id == id);
        if (cat) {
          if (action === 'edit') openEditModal(cat);
          if (action === 'delete') confirmDelete(cat);
        }
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  });
</script>

<div class="flex items-center justify-between mb-6">
  <div>
    <h2 class="text-2xl font-bold text-white mb-1">Danh mục sản phẩm</h2>
    <p class="text-gray-400 text-sm">Quản lý các danh mục hiển thị trên cửa hàng</p>
  </div>
  <button onclick={openAddModal} class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/20">
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
    Thêm danh mục
  </button>
</div>

<DataTable {columns} data={categories} {loading} />

<!-- Add/Edit Modal -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div class="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
      <h3 class="text-xl font-bold text-white mb-4">{isEditing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
      <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Tên danh mục *</label>
          <input required type="text" bind:value={formData.name} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Slug *</label>
          <input required type="text" bind:value={formData.slug} class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-400 mb-1">Icon (SVG/HTML)</label>
          <textarea bind:value={formData.icon} rows="3" class="w-full px-4 py-2 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-cyan-500 font-mono text-xs"></textarea>
        </div>
        
        <div class="flex justify-end gap-3 mt-6">
          <button type="button" onclick={() => showModal = false} class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">Hủy</button>
          <button type="submit" class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-medium transition-colors">Lưu</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Delete Confirm Modal -->
{#if showDeleteModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <div class="bg-dark-900 border border-dark-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <h3 class="text-xl font-semibold text-white mb-2">Xác nhận xóa</h3>
      <p class="text-gray-400 text-sm mb-6">Bạn có chắc chắn muốn xóa danh mục này? Không thể xóa nếu còn sản phẩm thuộc danh mục.</p>
      <div class="flex justify-end gap-3">
        <button onclick={() => showDeleteModal = false} class="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">Hủy</button>
        <button onclick={handleDelete} class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors">Xóa</button>
      </div>
    </div>
  </div>
{/if}
