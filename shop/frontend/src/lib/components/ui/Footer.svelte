<script lang="ts">
  import { icons } from '../../icons';
</script>

<footer class="bg-dark-950 border-t border-dark-800 pt-16 pb-8 relative overflow-hidden">
  <!-- Decorative background -->
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-500/50 to-transparent"></div>
  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[100px] bg-cyber-500/10 blur-[100px] pointer-events-none"></div>

  <div class="container mx-auto px-4 lg:px-8 relative z-10">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
      
      <!-- Brand -->
      <div class="flex flex-col gap-4">
        <a href="/" class="flex items-center gap-2.5 text-white">
          <img 
            src="/logo.png" 
            alt="Cellphone X Logo" 
            class="w-9 h-9 rounded-xl object-contain shadow-[0_0_12px_rgba(14,165,233,0.3)] bg-dark-900 border border-cyber-500/20 p-0.5"
          />
          <span class="text-xl font-bold tracking-tight">
            Cellphone <span class="text-transparent bg-clip-text bg-gradient-to-r from-neon-orange to-cyber-400">X</span>
          </span>
        </a>
        <p class="text-dark-400 text-sm leading-relaxed mt-2">
          Hệ thống bán lẻ điện thoại di động chính hãng uy tín. Mang đến cho bạn những trải nghiệm công nghệ đỉnh cao.
        </p>
      </div>
      
      <!-- Contact -->
      <div class="flex flex-col gap-4">
        <h3 class="text-white font-semibold mb-2">Thông tin liên hệ</h3>
        <ul class="flex flex-col gap-3">
          <li class="flex items-start gap-3 text-dark-300 text-sm">
            <div class="w-5 h-5 text-cyber-500 shrink-0">{@html icons.mapPin}</div>
            <span>TP. Thái Nguyên</span>
          </li>
          <li class="flex items-center gap-3 text-dark-300 text-sm">
            <div class="w-5 h-5 text-cyber-500 shrink-0">{@html icons.phone}</div>
            <a href="tel:0969610085" class="hover:text-cyber-400 transition-colors">0969610085</a>
          </li>
          <li class="flex items-center gap-3 text-dark-300 text-sm">
            <div class="w-5 h-5 text-cyber-500 shrink-0">{@html icons.mail}</div>
            <a href="mailto:nguyendiem1892005@gmail.com" class="hover:text-cyber-400 transition-colors">nguyendiem1892005@gmail.com</a>
          </li>
        </ul>
      </div>
      
      <!-- Links -->
      <div class="flex flex-col gap-4">
        <h3 class="text-white font-semibold mb-2">Hỗ trợ khách hàng</h3>
        <ul class="flex flex-col gap-2">
          <li><a href="/page/doi-tra" class="text-dark-400 hover:text-cyber-400 text-sm transition-colors">Chính sách đổi trả</a></li>
          <li><a href="/page/bao-hanh" class="text-dark-400 hover:text-cyber-400 text-sm transition-colors">Chính sách bảo hành</a></li>
          <li><a href="/page/van-chuyen" class="text-dark-400 hover:text-cyber-400 text-sm transition-colors">Chính sách vận chuyển</a></li>
          <li><a href="/page/faq" class="text-dark-400 hover:text-cyber-400 text-sm transition-colors">Câu hỏi thường gặp</a></li>
          <li><a href="/admin/login" class="text-cyber-400/80 hover:text-cyber-300 text-xs font-medium transition-colors">🔐 Trang Quản trị (Admin)</a></li>
        </ul>
      </div>
      
      <!-- Newsletter -->
      <div class="flex flex-col gap-4">
        <h3 class="text-white font-semibold mb-2">Đăng ký nhận tin</h3>
        <p class="text-dark-400 text-sm">Nhận thông tin ưu đãi mới nhất từ Cellphone X.</p>
        <div class="flex mt-2">
          <input type="email" placeholder="Email của bạn..." class="bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-l-lg outline-none focus:border-cyber-500 w-full text-sm">
          <button class="bg-gradient-to-r from-cyber-600 to-cyber-500 text-white px-4 py-2 rounded-r-lg hover:from-cyber-500 hover:to-cyber-400 transition-colors">
            <div class="w-5 h-5">{@html icons.mail}</div>
          </button>
        </div>
      </div>
      
    </div>
    
    <div class="border-t border-dark-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
      <p class="text-dark-500 text-sm text-center md:text-left">
        © 2026 Cellphone X — Made with <span class="text-red-500">❤️</span> by Quốc Jee. All rights reserved.
      </p>
      <div class="flex items-center gap-4 text-dark-500">
        <!-- Socials placeholder -->
        <a href="/" class="w-8 h-8 rounded-full bg-dark-900 flex items-center justify-center hover:bg-cyber-500/20 hover:text-cyber-400 transition-all">
          <div class="w-4 h-4">{@html icons.globe}</div>
        </a>
      </div>
    </div>
  </div>
</footer>
