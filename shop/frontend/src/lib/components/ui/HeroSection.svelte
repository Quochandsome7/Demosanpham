<script lang="ts">
  import ParticleCanvas from './ParticleCanvas.svelte';
  import { icons } from '../../icons';
</script>

<section class="relative w-full h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden bg-dark-950 border-b border-white/5">
  <!-- Background Elements -->
  <ParticleCanvas />
  
  <div class="absolute inset-0 bg-gradient-to-b from-dark-950/20 via-dark-950/50 to-dark-950 pointer-events-none"></div>
  
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyber-500/10 rounded-full blur-[120px] pointer-events-none"></div>

  <!-- Content -->
  <div class="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-500/10 border border-cyber-500/30 text-cyber-400 text-sm font-medium mb-8 animate-fade-in backdrop-blur-md">
      <div class="w-4 h-4 animate-pulse">{@html icons.fire}</div>
      <span>Kỷ nguyên công nghệ mới</span>
    </div>
    
    <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-normal leading-normal md:leading-relaxed mb-8 animate-slide-up [text-shadow:_0_0_30px_rgb(255_255_255_/_20%)] max-w-5xl">
      <span class="block mb-3 md:mb-4">Công nghệ đỉnh cao</span>
      <span class="block text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-cyber-400 to-neon-pink pb-1">Giá tốt nhất thị trường</span>
    </h1>
    
    <p class="text-dark-300 text-lg md:text-xl max-w-2xl mb-10 animate-slide-up" style="animation-delay: 0.1s;">
      Khám phá các dòng điện thoại thông minh mới nhất từ các thương hiệu hàng đầu thế giới với chính sách bảo hành và hậu mãi vượt trội.
    </p>
    
    <div class="flex flex-col sm:flex-row gap-4 animate-slide-up" style="animation-delay: 0.2s;">
      <a 
        href="#products" 
        class="relative overflow-hidden bg-cyber-600 text-white font-semibold py-3 px-8 rounded-lg transition-all group flex items-center gap-2 hover:shadow-[0_0_20px_rgba(2,132,199,0.5)]"
      >
        <div class="absolute inset-0 w-[20%] h-full bg-white/30 -skew-x-12 -translate-x-[200%] group-hover:animate-[sweep_1.5s_ease-in-out_infinite]"></div>
        <span>Mua ngay</span>
        <div class="w-5 h-5">{@html icons.shoppingBag}</div>
      </a>
      
      <a 
        href="/page/bao-hanh" 
        class="bg-dark-800/80 hover:bg-dark-700 text-white border border-white/10 font-medium py-3 px-8 rounded-lg transition-all backdrop-blur-sm"
      >
        Tìm hiểu thêm
      </a>
    </div>
  </div>
  
  <!-- Floating Elements -->
  <div class="absolute top-[20%] left-[10%] w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-blue rounded-2xl opacity-20 blur-xl animate-float"></div>
  <div class="absolute bottom-[20%] right-[10%] w-24 h-24 bg-gradient-to-br from-neon-pink to-cyber-500 rounded-full opacity-20 blur-2xl animate-float" style="animation-delay: -2s;"></div>
</section>

