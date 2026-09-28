<script lang="ts">
  import { cart, cartTotal } from '$lib/stores/cart';
  import { formatPrice } from '$lib/utils';
  import { icons } from '$lib/icons';
  import { api } from '$lib/api';
  import { toasts } from '$lib/stores/toast';
  import { customerAuth } from '$lib/stores/customerAuth';
  import { authModal } from '$lib/stores/authModal';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let cartItems = $derived($cart.items);
  let total = $derived($cartTotal);
  
  // Form fields
  let customerName = $state('');
  let customerPhone = $state('');
  let customerEmail = $state('');
  let shippingAddress = $state('');
  let notes = $state('');

  // Payment states
  let selectedMethod = $state<'vietqr' | 'cod' | 'wallet'>('vietqr');
  let selectedBank = $state('mbbank');
  let selectedWallet = $state('momo');

  // Coupon state
  let couponCode = $state('');
  let discount = $state(0);
  let couponMessage = $state('');

  // Order submission state
  let loading = $state(false);
  let success = $state(false);
  let orderId = $state<number | string>(0);
  let orderTotal = $state(0);

  // Bank configs
  const bankConfigs: Record<string, { name: string; sub: string; account: string; code: string; short: string; color: string; icon: string }> = {
    mbbank: { name: 'MB Bank', sub: 'Quân Đội', account: '0969610085', code: 'VIETQR • MB BANK', short: 'MB', color: 'bg-blue-700', icon: '/banks/mbbank.png' },
    vcb: { name: 'Vietcombank', sub: 'Ngoại Thương', account: '1029883921', code: 'VIETQR • VCB', short: 'VCB', color: 'bg-emerald-700', icon: '/banks/vcb.png' },
    tcb: { name: 'Techcombank', sub: 'Kỹ Thương', account: '19038291028', code: 'VIETQR • TECHCOM', short: 'TCB', color: 'bg-red-700', icon: '/banks/tcb.png' },
    bidv: { name: 'BIDV', sub: 'Đầu tư & PT', account: '31410008291', code: 'VIETQR • BIDV', short: 'BIDV', color: 'bg-cyan-700', icon: '/banks/bidv.png' },
    vpbank: { name: 'VPBank', sub: 'Thịnh Vượng', account: '0969610085', code: 'VIETQR • VPBANK', short: 'VPB', color: 'bg-emerald-600', icon: '/banks/vpbank.png' }
  };

  // Wallet configs
  const walletConfigs: Record<string, { name: string; sub: string; account: string; code: string; short: string; color: string; icon: string }> = {
    momo: { name: 'Momo', sub: 'Ví điện tử', account: '0969610085', code: 'MOMO QR', short: 'Momo', color: 'bg-[#a50064]', icon: '/wallets/momo.png' },
    vnpay: { name: 'VNPay', sub: 'Cổng VNPay QR', account: 'VNPAY-CPX99', code: 'VNPAY QR', short: 'VNPay', color: 'bg-[#005baa]', icon: '/wallets/vnpay.png' },
    zalopay: { name: 'ZaloPay', sub: 'Ví điện tử', account: '0969610085', code: 'ZALOPAY QR', short: 'ZaloPay', color: 'bg-[#008fe5]', icon: '/wallets/zalopay.png' },
    viettel: { name: 'ViettelPay', sub: 'Ví ViettelPay', account: '0969610085', code: 'VIETTELPAY', short: 'ViettelPay', color: 'bg-[#ee0033]', icon: '/wallets/viettel.png' }
  };

  // Auto-fill shipping information if user is logged in
  $effect(() => {
    if ($customerAuth.isAuthenticated && $customerAuth.user) {
      if (!customerName) customerName = $customerAuth.user.name || '';
      if (!customerPhone) customerPhone = $customerAuth.user.phone || '';
      if (!customerEmail) customerEmail = $customerAuth.user.email || '';
      if (!shippingAddress) shippingAddress = $customerAuth.user.address || '';
    }
  });

  function applyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (code === 'CPX500K') {
      discount = 500000;
      couponMessage = 'Đã áp dụng mã giảm giá 500.000₫!';
      toasts.add('Áp dụng mã CPX500K thành công (-500.000₫)', 'success');
    } else {
      discount = 0;
      couponMessage = 'Mã giảm giá không hợp lệ.';
      toasts.add('Mã giảm giá không hợp lệ', 'error');
    }
  }

  let finalTotal = $derived(Math.max(0, total - discount));

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (cartItems.length === 0) {
      toasts.add('Giỏ hàng đang trống!', 'warning');
      return;
    }

    if (!customerName || !customerPhone || !shippingAddress) {
      toasts.add('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Địa chỉ nhận hàng', 'warning');
      return;
    }
    
    loading = true;
    try {
      const bankOrWallet = selectedMethod === 'vietqr' ? selectedBank : selectedMethod === 'wallet' ? selectedWallet : null;

      const res = await api.createOrder({
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
          address: shippingAddress
        },
        shipping_address: shippingAddress,
        phone: customerPhone,
        note: notes || null,
        payment_method: selectedMethod,
        bank_or_wallet: bankOrWallet,
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product.price
        }))
      });
      
      orderId = res.data?.id || Math.floor(10000 + Math.random() * 90000);
      orderTotal = finalTotal;
      success = true;
      cart.clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      toasts.add(err.message || 'Có lỗi xảy ra khi tạo đơn hàng', 'error');
    } finally {
      loading = false;
    }
  }

  function copyText(str: string) {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(str);
      toasts.add(`Đã sao chép: ${str}`, 'info');
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  {#if success}
    <!-- ==================== ORDER SUCCESS SCREEN ==================== -->
    <div class="max-w-3xl mx-auto bg-dark-900/90 rounded-3xl border border-white/10 p-6 md:p-10 text-center backdrop-blur-md shadow-2xl animate-fade-in space-y-6">
      <div class="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
        <div class="w-10 h-10">{@html icons.check}</div>
      </div>

      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">Đặt hàng thành công!</h1>
        <p class="text-dark-300 text-sm">
          Cảm ơn bạn <span class="text-white font-semibold">{customerName}</span> đã tin tưởng mua sắm tại Cellphone X.
        </p>
        <div class="mt-3 inline-block bg-dark-950 px-4 py-1.5 rounded-xl border border-cyber-500/30 text-sm font-mono text-cyber-400">
          Mã đơn hàng: <span class="font-bold">#CPX-{orderId}</span>
        </div>
      </div>

      <!-- Payment Instructions: VietQR / Wallet -->
      {#if selectedMethod === 'vietqr' || selectedMethod === 'wallet'}
        {@const cfg = selectedMethod === 'vietqr' ? bankConfigs[selectedBank] : walletConfigs[selectedWallet]}
        <div class="bg-dark-950 border border-cyber-500/40 rounded-2xl p-5 md:p-6 text-left space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-dark-800">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                {#if cfg.icon}
                  <img src={cfg.icon} alt={cfg.name} class="w-5 h-5 rounded object-contain bg-white p-0.5" />
                {/if}
                <span>Quét mã thanh toán ({cfg.name})</span>
                <span class="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">Chờ chuyển khoản</span>
              </h3>
              <p class="text-xs text-dark-400 mt-0.5">Mở app Ngân hàng hoặc Ví điện tử quét mã bên dưới:</p>
            </div>
            <span class="text-base font-extrabold text-neon-blue">{formatPrice(orderTotal)}</span>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
            <!-- Simulated QR -->
            <div class="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center">
              <svg class="w-44 h-44" viewBox="0 0 100 100" fill="#0f172a">
                <rect x="5" y="5" width="25" height="25" fill="none" stroke="#0f172a" stroke-width="4"/>
                <rect x="10" y="10" width="15" height="15"/>
                <rect x="70" y="5" width="25" height="25" fill="none" stroke="#0f172a" stroke-width="4"/>
                <rect x="75" y="10" width="15" height="15"/>
                <rect x="5" y="70" width="25" height="25" fill="none" stroke="#0f172a" stroke-width="4"/>
                <rect x="10" y="75" width="15" height="15"/>
                <rect x="35" y="8" width="6" height="6"/>
                <rect x="45" y="8" width="6" height="6"/>
                <rect x="55" y="8" width="6" height="6"/>
                <rect x="35" y="35" width="15" height="15"/>
                <rect x="55" y="35" width="6" height="6"/>
                <rect x="65" y="35" width="10" height="6"/>
                <rect x="80" y="35" width="12" height="6"/>
                <rect x="35" y="55" width="6" height="6"/>
                <rect x="55" y="55" width="15" height="15"/>
                <rect x="45" y="85" width="15" height="6"/>
              </svg>
              <span class="text-[10px] font-bold text-slate-800 mt-1 tracking-wider uppercase">{cfg.code}</span>
            </div>

            <!-- Transfer Info -->
            <div class="space-y-2 text-xs w-full sm:w-auto">
              <div class="bg-dark-900 p-2.5 rounded-lg border border-dark-800">
                <span class="text-dark-400 block text-[11px]">Đơn vị thụ hưởng:</span>
                <span class="font-bold text-white">{cfg.name}</span>
              </div>
              <div class="bg-dark-900 p-2.5 rounded-lg border border-dark-800">
                <span class="text-dark-400 block text-[11px]">Số tài khoản / Số ví:</span>
                <div class="flex items-center justify-between gap-3">
                  <span class="font-mono font-bold text-cyber-400 text-sm">{cfg.account}</span>
                  <button type="button" onclick={() => copyText(cfg.account)} class="text-[11px] bg-dark-800 hover:bg-dark-700 text-dark-200 px-2.5 py-0.5 rounded border border-dark-700">Sao chép</button>
                </div>
              </div>
              <div class="bg-dark-900 p-2.5 rounded-lg border border-dark-800">
                <span class="text-dark-400 block text-[11px]">Chủ tài khoản:</span>
                <span class="font-bold text-white">NGUYEN VAN QUOC</span>
              </div>
              <div class="bg-dark-900 p-2.5 rounded-lg border border-dark-800">
                <span class="text-dark-400 block text-[11px]">Nội dung thanh toán (Bắt buộc):</span>
                <div class="flex items-center justify-between gap-3">
                  <span class="font-mono font-bold text-amber-400">CPX{orderId}</span>
                  <button type="button" onclick={() => copyText(`CPX${orderId}`)} class="text-[11px] bg-dark-800 hover:bg-dark-700 text-dark-200 px-2.5 py-0.5 rounded border border-dark-700">Sao chép</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      {:else}
        <!-- COD Notice -->
        <div class="bg-dark-950 border border-emerald-500/30 rounded-2xl p-5 text-left space-y-2">
          <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <div class="w-5 h-5">{@html icons.shield}</div>
            Xác nhận thanh toán khi nhận hàng (COD)
          </div>
          <p class="text-xs text-dark-300 leading-relaxed">
            Đơn hàng của bạn sẽ được nhân viên Cellphone X liên hệ gọi xác nhận trong vòng <span class="text-white font-bold">15 phút</span>. Vui lòng chuẩn bị số tiền mặt <span class="text-neon-blue font-bold">{formatPrice(orderTotal)}</span> khi shipper giao hàng tận nơi.
          </p>
        </div>
      {/if}

      <div class="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
        <a href="/" class="inline-flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-white font-medium py-3 px-8 rounded-xl transition-colors text-xs border border-white/5">
          <div class="w-4 h-4">{@html icons.home}</div>
          Tiếp tục mua hàng
        </a>
      </div>
    </div>
  {:else}
    <!-- ==================== MAIN CHECKOUT FORM ==================== -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white tracking-tight">Thanh toán đơn hàng</h1>
      <p class="text-dark-400 text-xs mt-1">Hoàn tất các bước bên dưới để nhận hàng sớm nhất.</p>
    </div>

    <form onsubmit={handleSubmit}>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Shipping & Payment Method Selection -->
        <div class="lg:col-span-2 space-y-6">

          <!-- 1. Customer Info & Auto-fill -->
          <div class="bg-dark-900/60 rounded-2xl border border-white/5 p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div class="flex items-center justify-between border-b border-white/5 pb-3">
              <h2 class="text-base font-semibold text-white flex items-center gap-2">
                <span class="w-6 h-6 rounded-lg bg-cyber-500/20 text-cyber-400 flex items-center justify-center text-xs font-bold">1</span>
                Thông tin nhận hàng
              </h2>

              {#if $customerAuth.isAuthenticated && $customerAuth.user}
                <div class="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
                  <div class="w-3.5 h-3.5">{@html icons.check}</div>
                  Tự động điền từ tài khoản ({$customerAuth.user.name})
                </div>
              {/if}
            </div>

            <!-- Login Prompt if Not Logged In -->
            {#if !$customerAuth.isAuthenticated}
              <div class="flex items-center justify-between p-3 rounded-xl bg-cyber-500/10 border border-cyber-500/30 text-xs">
                <div class="flex items-center gap-2">
                  <span>💡</span>
                  <span class="text-dark-300">Đăng nhập tài khoản để tự động điền thông tin và tích điểm.</span>
                </div>
                <button 
                  type="button" 
                  onclick={() => authModal.open('login')} 
                  class="shrink-0 text-xs px-3 py-1 bg-cyber-500 hover:bg-cyber-400 text-white font-semibold rounded-lg shadow-sm"
                >
                  Đăng nhập
                </button>
              </div>
            {/if}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label for="c-name" class="block font-medium text-dark-300 mb-1">Họ và tên người nhận <span class="text-rose-400">*</span></label>
                <input 
                  type="text" 
                  id="c-name" 
                  required 
                  bind:value={customerName} 
                  placeholder="Ví dụ: Nguyễn Văn Quốc" 
                  class="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyber-500 transition-colors"
                />
              </div>

              <div>
                <label for="c-phone" class="block font-medium text-dark-300 mb-1">Số điện thoại liên hệ <span class="text-rose-400">*</span></label>
                <input 
                  type="tel" 
                  id="c-phone" 
                  required 
                  bind:value={customerPhone} 
                  placeholder="0969610085" 
                  class="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyber-500 transition-colors"
                />
              </div>

              <div class="md:col-span-2">
                <label for="c-email" class="block font-medium text-dark-300 mb-1">Email nhận hóa đơn & bảo hành</label>
                <input 
                  type="email" 
                  id="c-email" 
                  bind:value={customerEmail} 
                  placeholder="nguyendiem1892005@gmail.com" 
                  class="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyber-500 transition-colors"
                />
              </div>

              <div class="md:col-span-2">
                <label for="c-addr" class="block font-medium text-dark-300 mb-1">Địa chỉ nhận hàng chi tiết <span class="text-rose-400">*</span></label>
                <textarea 
                  id="c-addr" 
                  required 
                  bind:value={shippingAddress} 
                  rows="2" 
                  placeholder="Số nhà, tên đường, Phường/Xã, TP. Thái Nguyên..." 
                  class="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyber-500 transition-colors resize-none"
                ></textarea>
              </div>

              <div class="md:col-span-2">
                <label for="c-notes" class="block font-medium text-dark-300 mb-1">Ghi chú giao hàng (Tùy chọn)</label>
                <input 
                  type="text" 
                  id="c-notes" 
                  bind:value={notes} 
                  placeholder="Ví dụ: Gọi trước khi giao 15 phút, giao giờ hành chính..." 
                  class="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <!-- 2. Payment Method Selection with Dropdown List of Banks & Wallets -->
          <div class="bg-dark-900/60 rounded-2xl border border-white/5 p-6 backdrop-blur-sm shadow-xl space-y-4">
            <h2 class="text-base font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <span class="w-6 h-6 rounded-lg bg-cyber-500/20 text-cyber-400 flex items-center justify-center text-xs font-bold">2</span>
              Phương thức thanh toán
            </h2>

            <div class="space-y-3">
              
              <!-- Option 1: VietQR Bank Transfer -->
              <div class="border rounded-2xl overflow-hidden transition-all {selectedMethod === 'vietqr' ? 'border-cyber-500 bg-cyber-500/5' : 'border-white/5 bg-dark-950/40 hover:border-white/10'}">
                <label class="flex items-center justify-between p-4 cursor-pointer">
                  <div class="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pay-method" 
                      value="vietqr" 
                      checked={selectedMethod === 'vietqr'}
                      onchange={() => selectedMethod = 'vietqr'}
                      class="text-cyber-500 focus:ring-0"
                    />
                    <div>
                      <div class="text-xs font-bold text-white flex items-center gap-2">
                        <span>Chuyển khoản Ngân hàng (VietQR / Napas 24/7)</span>
                        <span class="text-[10px] bg-cyber-500/20 text-cyber-400 border border-cyber-500/30 px-2 py-0.5 rounded-full font-semibold">Tự động duyệt</span>
                      </div>
                      <p class="text-[11px] text-dark-400 mt-0.5">Quét mã QR qua app ngân hàng bất kỳ, xác nhận tức thì</p>
                    </div>
                  </div>
                  <!-- Mini Bank Badges -->
                  <div class="flex items-center -space-x-1.5 shrink-0 bg-dark-900/80 p-1 rounded-xl border border-white/10 shadow-sm">
                    <img src="/banks/mbbank.png" alt="MB" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/banks/vcb.png" alt="VCB" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/banks/tcb.png" alt="TCB" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/banks/bidv.png" alt="BIDV" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/banks/vpbank.png" alt="VPB" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                  </div>
                </label>

                <!-- Sub-dropdown: Select Specific Bank -->
                {#if selectedMethod === 'vietqr'}
                  <div class="px-4 pb-4 pt-2.5 border-t border-cyber-500/20 bg-dark-950/70 animate-fade-in">
                    <div class="flex items-center justify-between mb-2.5">
                      <span class="text-[11px] text-cyber-300 font-semibold">Chọn ngân hàng nhận chuyển khoản:</span>
                      <span class="text-[10px] text-dark-400">Đề xuất: MB Bank (chính chủ shop)</span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {#each Object.entries(bankConfigs) as [bKey, bVal]}
                        <button 
                          type="button" 
                          onclick={() => selectedBank = bKey}
                          class="p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all {selectedBank === bKey ? 'border-cyber-500 bg-cyber-500/20 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)] ring-1 ring-cyber-500/50' : 'border-white/10 bg-dark-900/80 text-dark-300 hover:border-white/20 hover:bg-dark-900'}"
                        >
                          <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-sm border border-white/20 p-1">
                            <img src={bVal.icon} alt={bVal.name} class="w-full h-full object-contain" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-bold text-xs text-white truncate leading-tight">{bVal.name}</div>
                            <div class="text-[10px] text-dark-400 truncate leading-tight mt-0.5">{bVal.sub}</div>
                          </div>
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <!-- Option 2: COD -->
              <div class="border rounded-2xl overflow-hidden transition-all {selectedMethod === 'cod' ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 bg-dark-950/40 hover:border-white/10'}">
                <label class="flex items-center justify-between p-4 cursor-pointer">
                  <div class="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pay-method" 
                      value="cod" 
                      checked={selectedMethod === 'cod'}
                      onchange={() => selectedMethod = 'cod'}
                      class="text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <div class="text-xs font-bold text-white">Thanh toán khi nhận hàng (COD)</div>
                      <p class="text-[11px] text-dark-400 mt-0.5">Nhận hàng, kiểm tra rồi thanh toán tiền mặt cho shipper</p>
                    </div>
                  </div>
                  <div class="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">💵</div>
                </label>
              </div>

              <!-- Option 3: E-Wallets -->
              <div class="border rounded-2xl overflow-hidden transition-all {selectedMethod === 'wallet' ? 'border-pink-500 bg-pink-500/5' : 'border-white/5 bg-dark-950/40 hover:border-white/10'}">
                <label class="flex items-center justify-between p-4 cursor-pointer">
                  <div class="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="pay-method" 
                      value="wallet" 
                      checked={selectedMethod === 'wallet'}
                      onchange={() => selectedMethod = 'wallet'}
                      class="text-pink-500 focus:ring-0"
                    />
                    <div>
                      <div class="text-xs font-bold text-white">Ví điện tử: Momo, VNPay, ZaloPay, ViettelPay</div>
                      <p class="text-[11px] text-dark-400 mt-0.5">Thanh toán quét mã ví điện tử nhanh chóng</p>
                    </div>
                  </div>
                  <!-- Mini Wallet Badges -->
                  <div class="flex items-center -space-x-1.5 shrink-0 bg-dark-900/80 p-1 rounded-xl border border-white/10 shadow-sm">
                    <img src="/wallets/momo.png" alt="Momo" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/wallets/vnpay.png" alt="VNPay" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/wallets/zalopay.png" alt="ZaloPay" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                    <img src="/wallets/viettel.png" alt="ViettelPay" class="w-6 h-6 rounded-md object-contain bg-white p-0.5 border border-dark-900 shadow" />
                  </div>
                </label>

                <!-- Sub-dropdown: Select Specific Wallet -->
                {#if selectedMethod === 'wallet'}
                  <div class="px-4 pb-4 pt-2.5 border-t border-pink-500/20 bg-dark-950/70 animate-fade-in">
                    <div class="text-[11px] text-pink-300 font-semibold mb-2.5">Chọn loại ví bạn muốn dùng:</div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {#each Object.entries(walletConfigs) as [wKey, wVal]}
                        <button 
                          type="button" 
                          onclick={() => selectedWallet = wKey}
                          class="p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all {selectedWallet === wKey ? 'border-pink-500 bg-pink-500/20 text-white shadow-[0_0_15px_rgba(244,114,182,0.3)] ring-1 ring-pink-500/50' : 'border-white/10 bg-dark-900/80 text-dark-300 hover:border-white/20 hover:bg-dark-900'}"
                        >
                          <div class="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-sm border border-white/20 p-1">
                            <img src={wVal.icon} alt={wVal.name} class="w-full h-full object-contain" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="font-bold text-xs text-white truncate leading-tight">{wVal.name}</div>
                            <div class="text-[10px] text-dark-400 truncate leading-tight mt-0.5">{wVal.sub}</div>
                          </div>
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

            </div>
          </div>
        </div>
        
        <!-- Right Column: Order Summary & Placement -->
        <div>
          <div class="bg-dark-900/60 rounded-2xl border border-white/5 p-6 sticky top-24 backdrop-blur-sm shadow-xl space-y-4">
            <h2 class="text-base font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <div class="w-5 h-5 text-cyber-500">{@html icons.shoppingBag}</div>
              Đơn hàng ({cartItems.length} sản phẩm)
            </h2>
            
            <!-- Items list -->
            <div class="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {#each cartItems as item}
                <div class="flex gap-3 items-center">
                  <img src={item.product.image_url || '/placeholder.png'} alt={item.product.name} class="w-12 h-12 object-cover rounded-xl bg-dark-950 p-1 border border-white/5 shrink-0">
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white text-xs font-medium truncate">{item.product.name}</h3>
                    <div class="flex justify-between mt-1 text-xs">
                      <span class="text-dark-400 text-[11px]">SL: {item.quantity}</span>
                      <span class="text-cyber-400 font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Coupon Code Box -->
            <div class="pt-3 border-t border-white/5">
              <div class="flex gap-2">
                <input 
                  type="text" 
                  bind:value={couponCode} 
                  placeholder="Mã: CPX500K" 
                  class="bg-dark-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyber-500 w-full uppercase"
                />
                <button 
                  type="button" 
                  onclick={applyCoupon}
                  class="bg-dark-800 hover:bg-dark-700 text-cyber-400 border border-cyber-500/30 rounded-xl px-3 text-xs font-semibold transition-all"
                >
                  Áp dụng
                </button>
              </div>
              {#if couponMessage}
                <p class="text-[11px] mt-1 font-medium {discount > 0 ? 'text-emerald-400' : 'text-rose-400'}">{couponMessage}</p>
              {/if}
            </div>
            
            <!-- Price Breakdown -->
            <div class="border-t border-white/5 pt-3 space-y-2 text-xs">
              <div class="flex justify-between text-dark-300">
                <span>Tạm tính</span>
                <span class="text-white">{formatPrice(total)}</span>
              </div>
              <div class="flex justify-between text-dark-300">
                <span>Phí vận chuyển</span>
                <span class="text-emerald-400 font-semibold">Miễn phí</span>
              </div>
              {#if discount > 0}
                <div class="flex justify-between text-emerald-400">
                  <span>Mã giảm giá</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              {/if}
            </div>
            
            <!-- Total -->
            <div class="border-t border-white/5 pt-3">
              <div class="flex justify-between items-baseline">
                <span class="text-white font-semibold text-sm">Tổng thanh toán</span>
                <span class="text-2xl font-extrabold text-neon-blue">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              disabled={loading || cartItems.length === 0}
              class="w-full bg-gradient-to-r from-cyber-600 to-neon-blue hover:from-cyber-500 hover:to-cyber-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(2,132,199,0.35)] flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {#if loading}
                <span>Đang xử lý đơn hàng...</span>
              {:else}
                <span>Xác nhận đặt hàng</span>
                <div class="w-4 h-4">{@html icons.check}</div>
              {/if}
            </button>
          </div>
        </div>

      </div>
    </form>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
</style>
