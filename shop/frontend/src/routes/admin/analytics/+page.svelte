<script lang="ts">
  import { onMount } from 'svelte';
  import StatsCard from '$lib/components/admin/StatsCard.svelte';
  import { api } from '$lib/api';
  import { icons } from '$lib/icons';

  type CountRow = { key: string; count: number };
  type Stats = {
    hours: number;
    totals: { visitors: number; ips: number; page_views: number; events: number };
    byEvent: CountRow[];
    byCountry: CountRow[];
    byCity: CountRow[];
    byDevice: CountRow[];
    byOs: CountRow[];
    byBrowser: CountRow[];
    byReferrer: CountRow[];
    topPages: CountRow[];
    topProducts: CountRow[];
    byHour: CountRow[];
  };

  const ranges = [
    { label: '24 giờ', hours: 24 },
    { label: '7 ngày', hours: 24 * 7 },
    { label: '30 ngày', hours: 24 * 30 }
  ];

  const eventLabels: Record<string, string> = {
    page_view: 'Xem trang',
    product_view: 'Xem sản phẩm',
    search: 'Tìm kiếm',
    add_to_cart: 'Thêm giỏ hàng',
    begin_checkout: 'Bắt đầu đặt hàng',
    purchase: 'Đặt hàng thành công'
  };
  const funnel = ['page_view', 'product_view', 'add_to_cart', 'begin_checkout', 'purchase'];

  const regionNames = new Intl.DisplayNames(['vi'], { type: 'region' });
  function countryName(code: string) {
    try { return code.length === 2 ? regionNames.of(code) || code : code; } catch { return code; }
  }

  let hours = $state(24);
  let stats = $state<Stats | null>(null);
  let loading = $state(true);
  let error = $state('');

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await api.getAnalyticsStats(hours);
      stats = res.data;
    } catch (e: any) {
      error = e.message || 'Không tải được thống kê';
    } finally {
      loading = false;
    }
  }

  onMount(load);

  function max(rows: CountRow[]) {
    return Math.max(1, ...rows.map((r) => r.count));
  }
  function eventCount(key: string) {
    return stats?.byEvent.find((e) => e.key === key)?.count ?? 0;
  }

  let groups = $derived(
    stats
      ? [
          { title: 'Quốc gia', rows: stats.byCountry, label: countryName },
          { title: 'Thành phố', rows: stats.byCity, label: (k: string) => k },
          { title: 'Thiết bị', rows: stats.byDevice, label: (k: string) => k },
          { title: 'Hệ điều hành', rows: stats.byOs, label: (k: string) => k },
          { title: 'Trình duyệt', rows: stats.byBrowser, label: (k: string) => k },
          { title: 'Nguồn truy cập', rows: stats.byReferrer, label: (k: string) => k },
          { title: 'Trang được xem nhiều', rows: stats.topPages, label: (k: string) => k },
          { title: 'Sản phẩm được xem nhiều', rows: stats.topProducts, label: (k: string) => k }
        ]
      : []
  );
</script>

<div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white mb-1">Thống kê truy cập</h2>
      <p class="text-gray-400">Dữ liệu ghi nhận trong D1, lưu tối đa 30 ngày</p>
    </div>
    <div class="flex gap-2">
      {#each ranges as r}
        <button
          onclick={() => { hours = r.hours; load(); }}
          class="px-4 py-2 rounded-lg text-sm border transition-colors {hours === r.hours
            ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
            : 'border-dark-700 text-gray-400 hover:text-white'}"
        >
          {r.label}
        </button>
      {/each}
    </div>
  </div>

  {#if error}
    <div class="rounded-2xl border border-red-500/20 bg-dark-900 p-6 text-sm text-red-400">{error}</div>
  {:else if loading && !stats}
    <div class="rounded-2xl border border-dark-700 bg-dark-900 p-6 text-sm text-gray-400">Đang tải...</div>
  {:else if stats}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard title="Người truy cập" value={stats.totals.visitors} change={undefined} icon={icons.users} color="blue" />
      <StatsCard title="Lượt xem trang" value={stats.totals.page_views} change={undefined} icon={icons.eye} color="cyan" />
      <StatsCard title="Số IP khác nhau" value={stats.totals.ips} change={undefined} icon={icons.globe} color="purple" />
      <StatsCard title="Tổng sự kiện" value={stats.totals.events} change={undefined} icon={icons.barChart} color="green" />
    </div>

    <!-- Phễu hành vi -->
    <div class="rounded-2xl border border-dark-700 bg-dark-900 p-6">
      <h3 class="text-sm font-medium text-gray-400 mb-4">Hành vi khách hàng</h3>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {#each [...funnel.slice(0, 1), 'search', ...funnel.slice(1)] as key}
          <div class="rounded-xl bg-dark-800 p-4">
            <p class="text-xs text-gray-400 mb-1">{eventLabels[key]}</p>
            <p class="text-2xl font-bold text-white">{eventCount(key)}</p>
          </div>
        {/each}
      </div>
    </div>

    <!-- Theo giờ -->
    {#if stats.byHour.length > 0}
      <div class="rounded-2xl border border-dark-700 bg-dark-900 p-6">
        <h3 class="text-sm font-medium text-gray-400 mb-4">Người truy cập theo giờ (UTC)</h3>
        <div class="flex items-end gap-1 h-32">
          {#each stats.byHour as h}
            <div
              class="flex-1 min-w-[2px] rounded-t bg-cyan-500/70 hover:bg-cyan-400"
              style="height: {(h.count / max(stats.byHour)) * 100}%"
              title="{h.key}: {h.count} người"
            ></div>
          {/each}
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {#each groups as group}
        <div class="rounded-2xl border border-dark-700 bg-dark-900 p-6">
          <h3 class="text-sm font-medium text-gray-400 mb-4">{group.title}</h3>
          {#if group.rows.length === 0}
            <p class="text-sm text-gray-500">Chưa có dữ liệu</p>
          {:else}
            <ul class="space-y-3">
              {#each group.rows as row}
                <li>
                  <div class="flex justify-between gap-4 text-sm mb-1">
                    <span class="text-gray-200 truncate">{group.label(row.key)}</span>
                    <span class="text-gray-400 shrink-0">{row.count}</span>
                  </div>
                  <div class="h-2 rounded-full bg-dark-800">
                    <div class="h-2 rounded-full bg-cyan-500" style="width: {(row.count / max(group.rows)) * 100}%"></div>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/each}
    </div>

    <p class="text-xs text-gray-500">
      Vị trí là gần đúng theo mạng (không phải GPS). "Người truy cập" đếm theo mã trình duyệt ẩn danh; một người dùng nhiều trình duyệt sẽ được tính nhiều lần.
    </p>
  {/if}
</div>
