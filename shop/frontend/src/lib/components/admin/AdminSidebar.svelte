<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { icons } from '$lib/icons';

  let isOpen = $state(false);

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: icons.dashboard, exact: true },
    { name: 'Sản phẩm', path: '/admin/products', icon: icons.box },
    { name: 'Danh mục', path: '/admin/categories', icon: icons.tag || icons.box },
    { name: 'Đơn hàng', path: '/admin/orders', icon: icons.cart },
    { name: 'Khách hàng', path: '/admin/customers', icon: icons.users }
  ];

  function toggle() {
    isOpen = !isOpen;
  }

  function isActive(itemPath: string, exact: boolean = false) {
    const currentPath = page.url.pathname;
    if (exact) {
      return currentPath === itemPath;
    }
    return currentPath.startsWith(itemPath);
  }
</script>

<div class="md:hidden flex items-center justify-between p-4 bg-dark-950 border-b border-dark-800">
  <div class="flex items-center gap-2.5">
    <img src="/logo.png" alt="Logo" class="w-7 h-7 rounded-lg object-contain bg-dark-900 border border-cyber-500/20 p-0.5" />
    <div class="text-xl font-bold text-white">
      Cellphone <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-cyber-400">X</span>
    </div>
  </div>
  <button onclick={toggle} class="text-gray-300 hover:text-white focus:outline-none">
    {@html isOpen ? icons.close : icons.menu}
  </button>
</div>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="fixed inset-0 z-40 bg-black/50 md:hidden" onclick={toggle} role="button" tabindex="0"></div>
{/if}

<aside class="{isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-dark-950 to-dark-900 border-r border-dark-800 transition-transform duration-300 ease-in-out flex flex-col">
  <div class="p-6 hidden md:block">
    <div class="flex items-center gap-3">
      <img src="/logo.png" alt="Cellphone X Logo" class="w-10 h-10 rounded-xl object-contain shadow-[0_0_15px_rgba(14,165,233,0.3)] bg-dark-900 border border-cyber-500/30 p-1" />
      <div>
        <div class="text-xl font-black tracking-tight text-white">
          CELLPHONE <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-cyber-400">X</span>
        </div>
        <span class="block text-[11px] font-medium text-dark-400 uppercase tracking-widest mt-0.5">Admin Panel</span>
      </div>
    </div>
  </div>

  <nav class="flex-1 px-4 py-4 space-y-2 overflow-y-auto mt-4 md:mt-0">
    {#each navItems as item}
      <a
        href={item.path}
        onclick={() => isOpen = false}
        class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group {isActive(item.path, item.exact) ? 'bg-cyan-900/20 text-cyan-400 border-l-4 border-cyan-400' : 'text-gray-400 hover:bg-dark-800 hover:text-gray-100 border-l-4 border-transparent'}"
      >
        <span class="w-5 h-5 flex-shrink-0 {isActive(item.path, item.exact) ? 'text-cyan-400' : 'text-gray-500 group-hover:text-gray-300'}">
          {@html item.icon}
        </span>
        <span class="font-medium">{item.name}</span>
      </a>
    {/each}
  </nav>

  <div class="p-4 border-t border-dark-800">
    <button
      onclick={() => { auth.logout(); goto('/admin/login'); }}
      class="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200"
    >
      <span class="w-5 h-5 flex-shrink-0">
        {@html icons.logout}
      </span>
      <span class="font-medium">Đăng xuất</span>
    </button>
  </div>
</aside>
