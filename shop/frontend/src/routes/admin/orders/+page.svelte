<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '$lib/utils';
  import DataTable from '$lib/components/admin/DataTable.svelte';

  let orders = $state([]);
  let loading = $state(true);
  let statusFilter = $state('');

  async function fetchOrders() {
    loading = true;
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await api.getOrders(params);
      orders = res.data || [];
    } catch (error) {
      console.error(error);
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    fetchOrders();
  });

  function handleFilterChange() {
    fetchOrders();
  }

  const columns = [
    { key: 'id', label: 'Mã đơn', class: 'font-mono text-xs' },
    { 
      key: 'customer', 
      label: 'Khách hàng',
      render: (row: any) => `
        <div>
          <div class="font-medium text-gray-200">${row.customerName}</div>
          <div class="text-xs text-gray-500">${row.phone}</div>
        </div>
      `
    },
    { 
      key: 'totalAmount', 
      label: 'Tổng tiền',
      render: (row: any) => `<div class="text-cyan-400 font-medium">${formatPrice(row.totalAmount)}</div>`
    },
    { 
      key: 'status', 
      label: 'Trạng thái',
      render: (row: any) => `<span class="px-2.5 py-1 text-xs font-medium rounded-full bg-${getStatusColor(row.status)}-500/20 text-${getStatusColor(row.status)}-400 border border-${getStatusColor(row.status)}-500/30">${getStatusLabel(row.status)}</span>`
    },
    { 
      key: 'createdAt', 
      label: 'Ngày tạo',
      render: (row: any) => formatDate(row.createdAt)
    }
  ];
</script>

<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
  <div>
    <h2 class="text-2xl font-bold text-white mb-1">Quản lý Đơn hàng</h2>
    <p class="text-gray-400 text-sm">Theo dõi và xử lý đơn hàng của khách</p>
  </div>
  
  <select 
    bind:value={statusFilter} 
    onchange={handleFilterChange}
    class="px-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none text-white"
  >
    <option value="">Tất cả trạng thái</option>
    <option value="pending">Chờ xác nhận</option>
    <option value="confirmed">Đã xác nhận</option>
    <option value="shipping">Đang giao</option>
    <option value="delivered">Đã giao</option>
    <option value="cancelled">Đã hủy</option>
  </select>
</div>

<DataTable 
  {columns} 
  data={orders} 
  {loading} 
  onRowClick={(row) => goto(`/admin/orders/${row.id}`)}
/>
