<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { formatDate } from '$lib/utils';
  import DataTable from '$lib/components/admin/DataTable.svelte';

  let customers = $state([]);
  let loading = $state(true);
  let searchQuery = $state('');

  async function fetchCustomers() {
    loading = true;
    try {
      const res = await api.getCustomers({ search: searchQuery });
      customers = res.data || [];
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchCustomers();
  });

  function handleSearch(e: Event) {
    e.preventDefault();
    fetchCustomers();
  }

  const columns = [
    { 
      key: 'name', 
      label: 'Khách hàng',
      render: (row: any) => `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
            ${row.name ? row.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div class="font-medium text-gray-200">${row.name || 'Khách vãng lai'}</div>
        </div>
      `
    },
    { key: 'phone', label: 'Số điện thoại', class: 'font-mono text-gray-300' },
    { key: 'email', label: 'Email', class: 'text-gray-400' },
    { 
      key: 'orderCount', 
      label: 'Số đơn hàng',
      render: (row: any) => `<span class="px-2.5 py-1 text-xs font-medium rounded-full bg-dark-700 text-white">${row.orderCount || 0} đơn</span>`
    },
    { key: 'createdAt', label: 'Ngày đăng ký', render: (row: any) => formatDate(row.createdAt) }
  ];
</script>

<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
  <div>
    <h2 class="text-2xl font-bold text-white mb-1">Khách hàng</h2>
    <p class="text-gray-400 text-sm">Quản lý thông tin khách hàng</p>
  </div>
  
  <form onsubmit={handleSearch} class="relative w-full sm:w-80">
    <input 
      type="text" 
      bind:value={searchQuery}
      placeholder="Tìm theo tên, SĐT..." 
      class="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white placeholder-gray-500"
    />
    <svg class="w-5 h-5 absolute left-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
  </form>
</div>

<DataTable 
  {columns} 
  data={customers} 
  {loading} 
/>
