<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/ui/Header.svelte';
  import Footer from '$lib/components/ui/Footer.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';
  import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
  import TickerBanner from '$lib/components/ui/TickerBanner.svelte';
  import AuthModal from '$lib/components/ui/AuthModal.svelte';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { cart } from '$lib/stores/cart';
  import { auth } from '$lib/stores/auth';
  import { customerAuth } from '$lib/stores/customerAuth';
  import { productsStore } from '$lib/stores/products';
  import { wishlistStore } from '$lib/stores/wishlist';
  import ChatWidget from '$lib/components/ui/ChatWidget.svelte';
  
  let { children } = $props();
  
  let cartOpen = $state(false);
  let isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));
  
  onMount(() => {
    cart.loadCart();
    auth.checkAuth();
    customerAuth.checkAuth();
    productsStore.loadProducts();
    productsStore.loadCategories();
    wishlistStore.loadWishlist();
  });
</script>

{#if isAdminRoute}
  <div class="min-h-screen bg-dark-950 font-sans text-white">
    {@render children()}
    <Toast />
  </div>
{:else}
  <div class="min-h-screen flex flex-col bg-dark-950 font-sans text-white">
    <TickerBanner />
    <Header onOpenCart={() => cartOpen = true} />
    
    <main class="flex-1 pt-28">
      {@render children()}
    </main>
    
    <Footer />
    
    <CartDrawer bind:isOpen={cartOpen} />
    <AuthModal />
    <ChatWidget />
    <Toast />
  </div>
{/if}
