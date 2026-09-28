<script lang="ts">
  let { title, value, icon, change, color = 'cyan' } = $props<{
    title: string;
    value: string | number;
    icon: string;
    change?: number;
    color?: 'cyan' | 'purple' | 'green' | 'yellow' | 'red' | 'blue';
  }>();

  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
    green: 'from-green-500/20 to-green-500/5 text-green-400 border-green-500/20',
    yellow: 'from-yellow-500/20 to-yellow-500/5 text-yellow-400 border-yellow-500/20',
    red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20'
  };

  let themeClasses = $derived(colorMap[color] || colorMap.cyan);
</script>

<div class="relative overflow-hidden rounded-2xl border bg-dark-900 p-6 {themeClasses}">
  <div class="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br {themeClasses.split(' ')[0]} {themeClasses.split(' ')[1]} rounded-full blur-2xl opacity-50"></div>
  
  <div class="flex items-center justify-between relative z-10">
    <div>
      <p class="text-sm font-medium text-gray-400 mb-1">{title}</p>
      <h3 class="text-3xl font-bold text-white">{value}</h3>
      
      {#if change !== undefined}
        <div class="flex items-center mt-2 text-sm {change >= 0 ? 'text-green-400' : 'text-red-400'}">
          {#if change >= 0}
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          {:else}
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>
          {/if}
          <span>{Math.abs(change)}% so với tháng trước</span>
        </div>
      {/if}
    </div>
    
    <div class="p-3 rounded-xl bg-dark-800 border border-dark-700 text-current">
      <div class="w-8 h-8">
        {@html icon}
      </div>
    </div>
  </div>
</div>
