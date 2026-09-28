<script lang="ts">
  import { icons } from '../../icons';
  import { cartCount } from '../../stores/cart';
  import { customerAuth } from '../../stores/customerAuth';
  import { authModal } from '../../stores/authModal';
  import { page } from '$app/stores';
  
  let { onOpenCart } = $props<{ onOpenCart: () => void }>();
  
  let isScrolled = $state(false);
  let mobileMenuOpen = $state(false);
  
  $effect(() => {
    const handleScroll = () => {
      isScrolled = window.scrollY > 20;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
  
  const navLinks = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Sản phẩm', href: '/#products' },
    { name: 'Giỏ hàng', href: '/cart' },
    { name: 'Bảo hành', href: '/page/bao-hanh' },
    { name: 'Liên hệ', href: '/page/lien-he' }
  ];
</script>

<header 
  class="fixed top-8 left-0 right-0 z-40 transition-all duration-300 border-b {isScrolled ? 'bg-dark-950/95 backdrop-blur-md border-white/10 py-2.5 shadow-xl' : 'bg-dark-950/85 backdrop-blur-md border-white/5 py-3.5'}"
>
  <div class="container mx-auto px-4 lg:px-8">
    <div class="flex items-center justify-between">
      
      <!-- Logo -->
      <a href="/" class="flex items-center gap-2.5 text-white group">
        <img 
          src="/logo.png" 
          alt="Cellphone X Logo" 
          class="w-10 h-10 rounded-xl object-contain shadow-[0_0_15px_rgba(14,165,233,0.4)] group-hover:shadow-[0_0_20px_rgba(251,146,60,0.6)] transition-all bg-dark-900 border border-cyber-500/30 p-0.5"
        />
        <span class="text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
          Cellphone <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-cyber-400">X</span>
        </span>
      </a>
      
      <!-- Desktop Nav -->
      <nav class="hidden md:flex items-center gap-8">
        {#each navLinks as link}
          <a 
            href={link.href} 
            class="text-sm font-medium text-dark-300 hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-neon-blue after:transition-all hover:after:w-full"
          >
            {link.name}
          </a>
        {/each}
      </nav>
      
      <!-- Actions -->
      <div class="flex items-center gap-3">
        <!-- Customer Account / Auth Button -->
        {#if $customerAuth.isAuthenticated && $customerAuth.user}
          <div class="hidden sm:flex items-center gap-2 bg-dark-900 border border-cyber-500/30 px-2.5 py-1.5 rounded-xl shadow-sm">
            <div class="w-6 h-6 rounded-full bg-gradient-to-tr from-cyber-500 to-neon-blue flex items-center justify-center text-xs font-bold text-white uppercase">
              {$customerAuth.user.name ? $customerAuth.user.name.charAt(0) : 'U'}
            </div>
            <div class="text-left text-xs">
              <span class="font-semibold text-white block leading-none">{$customerAuth.user.name}</span>
            </div>
            <button 
              onclick={() => customerAuth.logout()} 
              title="Đăng xuất"
              class="text-dark-400 hover:text-rose-400 ml-1 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        {:else}
          <button 
            onclick={() => authModal.open('login')}
            class="hidden sm:flex items-center gap-1.5 text-xs font-medium text-dark-300 hover:text-white bg-dark-900 border border-white/10 hover:border-cyber-500/50 px-3 py-1.5 rounded-xl transition-all"
          >
            <div class="w-4 h-4">{@html icons.users}</div>
            <span>Đăng nhập</span>
          </button>
        {/if}

        <!-- Cart Button -->
        <button 
          type="button"
          onclick={onOpenCart}
          class="relative p-2.5 rounded-xl bg-dark-900/80 border border-white/10 hover:border-cyber-500/50 text-dark-200 hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_rgba(2,132,199,0.3)] flex items-center justify-center"
          aria-label="Giỏ hàng ({$cartCount})"
          title="Xem giỏ hàng"
        >
          <div class="w-5 h-5">{@html icons.cart}</div>
          {#if $cartCount > 0}
            <span class="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center bg-neon-pink text-white text-[10px] font-bold rounded-full border-2 border-dark-950 shadow-md">
              {$cartCount}
            </span>
          {/if}
        </button>
        
        <!-- Mobile Menu Toggle -->
        <button 
          class="md:hidden p-2 text-dark-300 hover:text-white transition-colors"
          onclick={() => mobileMenuOpen = !mobileMenuOpen}
        >
          <div class="w-6 h-6">
            {#if mobileMenuOpen}
              {@html icons.close}
            {:else}
              {@html icons.menu}
            {/if}
          </div>
        </button>
      </div>
    </div>
  </div>
</header>

<!-- Mobile Nav Drawer -->
{#if mobileMenuOpen}
  <div class="fixed inset-0 z-30 bg-dark-950/95 backdrop-blur-md pt-24 px-6 md:hidden">
    <nav class="flex flex-col gap-5">
      <!-- Mobile Auth section -->
      {#if $customerAuth.isAuthenticated && $customerAuth.user}
        <div class="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-white/10 mb-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-cyber-500 text-white font-bold flex items-center justify-center text-xs">
              {$customerAuth.user.name.charAt(0)}
            </div>
            <div>
              <div class="text-xs font-bold text-white">{$customerAuth.user.name}</div>
              <div class="text-[10px] text-dark-400">{$customerAuth.user.phone}</div>
            </div>
          </div>
          <button onclick={() => { customerAuth.logout(); mobileMenuOpen = false; }} class="text-xs text-rose-400 font-semibold px-2 py-1">
            Đăng xuất
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-2 gap-2 mb-2">
          <button 
            onclick={() => { authModal.open('login'); mobileMenuOpen = false; }} 
            class="text-xs py-2 bg-dark-900 border border-white/10 text-white rounded-xl font-medium"
          >
            Đăng nhập
          </button>
          <button 
            onclick={() => { authModal.open('register'); mobileMenuOpen = false; }} 
            class="text-xs py-2 bg-cyber-500 text-white rounded-xl font-medium"
          >
            Đăng ký
          </button>
        </div>
      {/if}

      {#each navLinks as link}
        <a 
          href={link.href} 
          class="text-base font-medium text-dark-200 hover:text-white transition-colors"
          onclick={() => mobileMenuOpen = false}
        >
          {link.name}
        </a>
      {/each}
    </nav>
  </div>
{/if}
