<script lang="ts">
  import { api } from '$lib/api';
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let username = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let errorMsg = $state('');

  async function handleLogin(e: Event) {
    e.preventDefault();
    if (!username || !password) {
      errorMsg = 'Vui lòng nhập tài khoản và mật khẩu';
      return;
    }

    isLoading = true;
    errorMsg = '';

    try {
      await auth.login(username, password);
      goto('/admin');
    } catch (error: any) {
      errorMsg = error?.message || 'Tài khoản hoặc mật khẩu không đúng';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="relative min-h-screen flex items-center justify-center overflow-hidden">
  <!-- Particle background effect placeholder -->
  <div class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-dark-800 via-dark-950 to-dark-950">
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
  </div>
  <div class="relative z-10 w-full max-w-md p-8 bg-dark-900/80 backdrop-blur-xl border border-dark-700 rounded-3xl shadow-2xl">
    <div class="text-center mb-10 flex flex-col items-center">
      <img src="/logo.png" alt="Cellphone X Logo" class="w-16 h-16 rounded-2xl object-contain shadow-[0_0_20px_rgba(14,165,233,0.4)] bg-dark-950 border border-cyber-500/30 p-1 mb-3" />
      <h1 class="text-3xl font-black tracking-tight text-white">
        CELLPHONE <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-cyber-400">X</span>
      </h1>
      <p class="text-gray-400 text-sm font-medium mt-1">Quản trị hệ thống</p>
    </div>

    <form onsubmit={handleLogin} class="space-y-6">
      {#if errorMsg}
        <div class="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {errorMsg}
        </div>
      {/if}

      <div>
        <label for="username" class="block text-sm font-medium text-gray-400 mb-2">Tên đăng nhập</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          placeholder="Nhập tên đăng nhập"
          class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-400 mb-2">Mật khẩu</label>
        <input
          type="password"
          id="password"
          bind:value={password}
          placeholder="Nhập mật khẩu"
          class="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-white placeholder-gray-600"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        class="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-70 flex items-center justify-center"
      >
        {#if isLoading}
          <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Đang đăng nhập...
        {:else}
          Đăng nhập
        {/if}
      </button>
    </form>
    
    <div class="mt-8 text-center text-xs text-gray-600">
      &copy; 2026 Cellphone X — Made with ❤️ by Quốc Jee.
    </div>
  </div>
</div>
