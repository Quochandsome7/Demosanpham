<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { auth } from '$lib/stores/auth';
  import AdminSidebar from '$lib/components/admin/AdminSidebar.svelte';

  let { children } = $props();
  
  let isLoading = $state(true);

  onMount(async () => {
    try {
      await auth.checkAuth();
    } finally {
      isLoading = false;
    }
  });

  $effect(() => {
    // Only redirect AFTER checkAuth has completed (isLoading is false)
    if (!isLoading && !$auth.loading) {
      if (!$auth.isAuthenticated && page.url.pathname !== '/admin/login') {
        goto('/admin/login');
      } else if ($auth.isAuthenticated && page.url.pathname === '/admin/login') {
        goto('/admin');
      }
    }
  });
</script>

{#if isLoading || $auth.loading}
  <div class="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-3 text-gray-400">
    <div class="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    <p class="text-xs text-gray-500 tracking-wider">ĐANG TẢI CELLPHONE X ADMIN...</p>
  </div>
{:else if page.url.pathname === '/admin/login'}
  <main class="min-h-screen bg-dark-950 text-gray-100 selection:bg-cyan-500/30 selection:text-cyan-200">
    {@render children()}
  </main>
{:else if $auth.isAuthenticated}
  <div class="min-h-screen bg-dark-950 text-gray-100 flex font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
    <AdminSidebar />
    
    <div class="flex-1 flex flex-col min-w-0 md:ml-64">
      <header class="h-16 px-6 bg-dark-950/80 backdrop-blur-md border-b border-dark-800 flex items-center justify-between sticky top-0 z-30">
        <h1 class="text-xl font-semibold text-gray-100 hidden md:block">
          {page.url.pathname === '/admin' ? 'Dashboard' : 
           page.url.pathname.includes('/admin/products') ? 'Quản lý Sản phẩm' :
           page.url.pathname.includes('/admin/categories') ? 'Quản lý Danh mục' :
           page.url.pathname.includes('/admin/orders') ? 'Quản lý Đơn hàng' :
           page.url.pathname.includes('/admin/customers') ? 'Quản lý Khách hàng' : ''}
        </h1>
        <div class="flex-1 md:hidden"></div>
        <div class="flex items-center gap-4">
          <div class="text-sm font-medium text-gray-300">
            Xin chào, <span class="text-cyan-400">{$auth.user?.username || 'Admin'}</span>
          </div>
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
            {($auth.user?.username || 'A')[0].toUpperCase()}
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div class="max-w-7xl mx-auto">
          {@render children()}
        </div>
      </main>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-3 text-gray-400">
    <div class="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
    <p class="text-sm">Đang chuyển hướng đến trang đăng nhập...</p>
  </div>
{/if}
