<script lang="ts">
  const items = [
    { icon: '🔥', text: 'Flash Sale: Giảm giá đến 50%' },
    { icon: '⚡', text: 'Freeship mọi đơn hàng từ 500k' },
    { icon: '🛡️', text: 'Bảo hành chính hãng 24 tháng' },
    { icon: '💳', text: 'Trả góp 0% lãi suất' },
    { icon: '🎁', text: 'Quà tặng hấp dẫn kèm theo' }
  ];
</script>

<div class="fixed top-0 left-0 right-0 h-8 bg-gradient-to-r from-cyber-900 via-dark-900 to-cyber-900 border-b border-cyber-500/20 overflow-hidden z-50 flex items-center">
  <div class="flex whitespace-nowrap animate-marquee">
    {#each Array(3) as _}
      <div class="flex shrink-0 items-center gap-8 mx-4">
        {#each items as item}
          <div class="flex items-center gap-2 text-xs font-medium text-cyber-200">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .animate-marquee {
    animation: marquee 30s linear infinite;
  }
  
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-33.333%); }
  }
</style>
