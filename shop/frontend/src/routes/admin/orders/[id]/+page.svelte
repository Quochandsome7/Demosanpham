<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { api } from '$lib/api';
  import { formatPrice, formatDate, getStatusColor, getStatusLabel } from '$lib/utils';
  import { addToast } from '$lib/stores/toast';

  let orderId = $derived(page.url.pathname.split('/').pop());
  let order = $state<any>(null);
  let loading = $state(true);
  let saving = $state(false);

  let statusOptions = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'shipping', label: 'Đang giao' },
    { value: 'delivered', label: 'Đã giao' },
    { value: 'cancelled', label: 'Đã hủy' }
  ];

  async function fetchOrder() {
    try {
      const res = await api.getOrder(orderId);
      order = res.data;
    } catch (error) {
      addToast('Lỗi khi tải thông tin đơn hàng', 'error');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (orderId) fetchOrder();
  });

  async function updateStatus() {
    saving = true;
    try {
      await api.updateOrder(orderId, { status: order.status });
      addToast('Cập nhật trạng thái thành công', 'success');
    } catch (error) {
      addToast('Lỗi khi cập nhật trạng thái', 'error');
    } finally {
      saving = false;
    }
  }
</script>

{#if loading}
  <div class="flex items-center justify-center h-64">
    <div class="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else if order}
  <div class="max-w-5xl space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <a href="/admin/orders" class="p-2 bg-dark-800 hover:bg-dark-700 text-gray-400 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </a>
        <div>
          <h2 class="text-2xl font-bold text-white flex items-center gap-3">
            Đơn hàng #{order.id}
            <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-{getStatusColor(order.status)}-500/20 text-{getStatusColor(order.status)}-400 border border-{getStatusColor(order.status)}-500/30">
              {getStatusLabel(order.status)}
            </span>
          </h2>
          <p class="text-sm text-gray-400 mt-1">Đặt lúc: {formatDate(order.createdAt)}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <select bind:value={order.status} class="px-4 py-2 bg-dark-900 border border-dark-700 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-white">
          {#each statusOptions as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <button onclick={updateStatus} disabled={saving} class="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          {#if saving}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {/if}
          Cập nhật
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-6">
        <!-- Order Items -->
        <div class="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-dark-800 bg-dark-800/30">
            <h3 class="font-semibold text-white">Sản phẩm ({order.items?.length || 0})</h3>
          </div>
          <div class="divide-y divide-dark-800 p-4 space-y-4">
            {#each order.items || [] as item}
              <div class="flex items-center gap-4 pt-4 first:pt-0">
                <img src={item.productImage || '/placeholder.png'} alt={item.productName} class="w-16 h-16 rounded-xl object-cover bg-dark-800" />
                <div class="flex-1 min-w-0">
                  <h4 class="text-white font-medium truncate">{item.productName}</h4>
                  <div class="text-sm text-gray-400 mt-1">{formatPrice(item.price)} x {item.quantity}</div>
                </div>
                <div class="text-right">
                  <div class="text-cyan-400 font-medium">{formatPrice(item.price * item.quantity)}</div>
                </div>
              </div>
            {/each}
          </div>
          <div class="p-4 border-t border-dark-800 bg-dark-800/30 flex justify-between items-center">
            <span class="text-gray-400 font-medium">Tổng tiền</span>
            <span class="text-xl font-bold text-cyan-400">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
        
        {#if order.note}
          <div class="bg-dark-900 border border-dark-800 rounded-2xl p-4">
            <h3 class="font-semibold text-white mb-2">Ghi chú của khách</h3>
            <p class="text-gray-300 text-sm p-3 bg-dark-800/50 rounded-lg">{order.note}</p>
          </div>
        {/if}
      </div>

      <!-- Customer Info -->
      <div class="space-y-6">
        <div class="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
          <div class="p-4 border-b border-dark-800 bg-dark-800/30">
            <h3 class="font-semibold text-white">Thông tin khách hàng</h3>
          </div>
          <div class="p-4 space-y-4 text-sm">
            <div>
              <div class="text-gray-500 mb-1">Họ tên</div>
              <div class="text-white font-medium">{order.customerName}</div>
            </div>
            <div>
              <div class="text-gray-500 mb-1">Số điện thoại</div>
              <div class="text-white font-medium">{order.phone}</div>
            </div>
            <div>
              <div class="text-gray-500 mb-1">Email</div>
              <div class="text-white font-medium">{order.email || 'Không có'}</div>
            </div>
            <div>
              <div class="text-gray-500 mb-1">Địa chỉ giao hàng</div>
              <div class="text-white font-medium leading-relaxed">{order.address}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}
