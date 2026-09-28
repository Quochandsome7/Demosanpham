<script lang="ts">
  import { authModal } from '../../stores/authModal';
  import { customerAuth } from '../../stores/customerAuth';
  import { toasts } from '../../stores/toast';
  import { auth } from '../../stores/auth';
  import { goto } from '$app/navigation';

  let activeTab = $derived($authModal.activeTab);
  let isOpen = $derived($authModal.isOpen);

  // Form states
  let loginIdentifier = $state('');
  let loginPassword = $state('');
  let loginLoading = $state(false);

  let regName = $state('');
  let regPhone = $state('');
  let regEmail = $state('');
  let regPassword = $state('');
  let regAddress = $state('');
  let regLoading = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) {
      toasts.add('Vui lòng nhập số điện thoại/email và mật khẩu', 'warning');
      return;
    }

    loginLoading = true;
    try {
      const trimmedId = loginIdentifier.trim();
      // Auto-detect Admin login if username is 'admin'
      if (trimmedId.toLowerCase() === 'admin') {
        try {
          await auth.login(trimmedId, loginPassword);
          toasts.add('Đăng nhập Quản trị viên thành công! Đang chuyển đến Admin...', 'success');
          authModal.close();
          loginIdentifier = '';
          loginPassword = '';
          goto('/admin');
          return;
        } catch (adminErr: any) {
          throw new Error('Mật khẩu quản trị viên không chính xác');
        }
      }

      const res = await customerAuth.login(trimmedId, loginPassword);
      toasts.add(`Chào mừng trở lại, ${res.user.name}!`, 'success');
      authModal.close();
      loginIdentifier = '';
      loginPassword = '';
    } catch (err: any) {
      toasts.add(err.message || 'Đăng nhập không thành công', 'error');
    } finally {
      loginLoading = false;
    }
  }

  async function handleRegister(e: Event) {
    e.preventDefault();
    if (!regName || !regPhone || !regPassword) {
      toasts.add('Vui lòng điền Họ tên, Số điện thoại và Mật khẩu', 'warning');
      return;
    }

    if (regPassword.length < 6) {
      toasts.add('Mật khẩu cần có tối thiểu 6 ký tự', 'warning');
      return;
    }

    regLoading = true;
    try {
      const res = await customerAuth.register({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword,
        address: regAddress
      });
      toasts.add(`Đăng ký tài khoản thành công! Chào bạn ${res.user.name}`, 'success');
      authModal.close();
      regName = '';
      regPhone = '';
      regEmail = '';
      regPassword = '';
      regAddress = '';
    } catch (err: any) {
      toasts.add(err.message || 'Đăng ký thất bại', 'error');
    } finally {
      regLoading = false;
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      authModal.close();
    }
  }
</script>

{#if isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div 
    class="fixed inset-0 bg-dark-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === 'Escape') authModal.close(); }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
  >
    <div class="bg-dark-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-slide-up text-white">
      
      <!-- Close Button -->
      <button 
        onclick={() => authModal.close()}
        class="absolute top-4 right-4 text-dark-400 hover:text-white w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center transition-colors border border-white/5"
        aria-label="Đóng"
      >
        ✕
      </button>

      <!-- Logo & Title -->
      <div class="text-center mb-5 flex flex-col items-center">
        <img 
          src="/logo.png" 
          alt="Cellphone X Logo" 
          class="w-12 h-12 rounded-xl object-contain mb-2 shadow-[0_0_20px_rgba(14,165,233,0.4)] bg-dark-950 border border-cyber-500/30 p-1"
        />
        <h3 class="text-base font-bold text-white tracking-wide">
          Tài Khoản Cellphone <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-cyber-400">X</span>
        </h3>
        <p class="text-xs text-dark-400 mt-0.5">Đăng nhập để nhận ưu đãi và tự động điền đơn hàng</p>
      </div>

      <!-- Tabs Switcher -->
      <div class="flex gap-2 border-b border-dark-800 pb-2 mb-4">
        <button 
          onclick={() => authModal.switchTab('login')}
          class="flex-1 text-xs font-semibold py-2 rounded-lg transition-all {activeTab === 'login' ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/40 shadow-sm' : 'text-dark-400 hover:text-white'}"
        >
          Đăng nhập
        </button>
        <button 
          onclick={() => authModal.switchTab('register')}
          class="flex-1 text-xs font-semibold py-2 rounded-lg transition-all {activeTab === 'register' ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/40 shadow-sm' : 'text-dark-400 hover:text-white'}"
        >
          Đăng ký thành viên
        </button>
      </div>

      <!-- Form 1: Login -->
      {#if activeTab === 'login'}
        <form onsubmit={handleLogin} class="space-y-3 text-xs">
          <div>
            <label class="block text-dark-300 mb-1" for="modal-login-id">Số điện thoại hoặc Email <span class="text-rose-400">*</span></label>
            <input 
              id="modal-login-id"
              type="text" 
              bind:value={loginIdentifier}
              placeholder="0969610085 hoặc email..." 
              required 
              class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div>
            <label class="block text-dark-300 mb-1" for="modal-login-pass">Mật khẩu <span class="text-rose-400">*</span></label>
            <input 
              id="modal-login-pass"
              type="password" 
              bind:value={loginPassword}
              placeholder="Nhập mật khẩu..." 
              required 
              class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div class="flex items-center justify-between text-[11px] pt-1">
            <label class="flex items-center gap-1.5 text-dark-400 cursor-pointer">
              <input type="checkbox" checked class="rounded bg-dark-950 border-dark-700 text-cyber-500 focus:ring-0">
              Ghi nhớ đăng nhập
            </label>
            <button 
              type="button" 
              onclick={() => toasts.add('Vui lòng liên hệ hotline 0969610085 để reset mật khẩu', 'info')} 
              class="text-cyber-400 hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loginLoading}
            class="w-full py-2.5 bg-gradient-to-r from-cyber-500 to-neon-blue hover:from-cyber-400 hover:to-neon-blue/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyber-500/25 transition-all mt-3 disabled:opacity-50"
          >
            {loginLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
          </button>

          <p class="text-[11px] text-dark-400 text-center pt-2">
            Chưa có tài khoản? 
            <button type="button" onclick={() => authModal.switchTab('register')} class="text-cyber-400 font-semibold underline ml-1">
              Đăng ký miễn phí
            </button>
          </p>

          <div class="pt-3 border-t border-dark-800 text-center">
            <a 
              href="/admin/login" 
              onclick={() => authModal.close()}
              class="text-[11px] text-dark-400 hover:text-cyber-400 transition-colors inline-flex items-center gap-1.5"
            >
              <span>🔐 Bạn là Quản trị viên? Đăng nhập trang Admin →</span>
            </a>
          </div>
        </form>
      {:else}
        <!-- Form 2: Register -->
        <form onsubmit={handleRegister} class="space-y-3 text-xs">
          <div>
            <label class="block text-dark-300 mb-1" for="modal-reg-name">Họ và tên của bạn <span class="text-rose-400">*</span></label>
            <input 
              id="modal-reg-name"
              type="text" 
              bind:value={regName}
              placeholder="Ví dụ: Nguyễn Văn Quốc" 
              required 
              class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-dark-300 mb-1" for="modal-reg-phone">Số điện thoại <span class="text-rose-400">*</span></label>
              <input 
                id="modal-reg-phone"
                type="tel" 
                bind:value={regPhone}
                placeholder="0969610085" 
                required 
                class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
              />
            </div>
            <div>
              <label class="block text-dark-300 mb-1" for="modal-reg-email">Email (tùy chọn)</label>
              <input 
                id="modal-reg-email"
                type="email" 
                bind:value={regEmail}
                placeholder="email@gmail.com" 
                class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-dark-300 mb-1" for="modal-reg-pass">Mật khẩu đăng nhập <span class="text-rose-400">*</span></label>
            <input 
              id="modal-reg-pass"
              type="password" 
              bind:value={regPassword}
              placeholder="Tối thiểu 6 ký tự" 
              required 
              class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
            />
          </div>

          <div>
            <label class="block text-dark-300 mb-1" for="modal-reg-addr">Địa chỉ nhận hàng mặc định</label>
            <input 
              id="modal-reg-addr"
              type="text" 
              bind:value={regAddress}
              placeholder="Ví dụ: Phường Hoàng Văn Thụ, TP. Thái Nguyên" 
              class="w-full bg-dark-950 border border-dark-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyber-500"
            />
            <p class="text-[10px] text-dark-400 mt-0.5">Địa chỉ này sẽ tự động điền khi bạn đặt hàng.</p>
          </div>

          <button 
            type="submit" 
            disabled={regLoading}
            class="w-full py-2.5 bg-gradient-to-r from-cyber-500 to-neon-blue hover:from-cyber-400 hover:to-neon-blue/90 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyber-500/25 transition-all mt-3 disabled:opacity-50"
          >
            {regLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản & Lưu địa chỉ'}
          </button>

          <p class="text-[11px] text-dark-400 text-center pt-2">
            Đã có tài khoản? 
            <button type="button" onclick={() => authModal.switchTab('login')} class="text-cyber-400 font-semibold underline ml-1">
              Đăng nhập ngay
            </button>
          </p>
        </form>
      {/if}

    </div>
  </div>
{/if}
