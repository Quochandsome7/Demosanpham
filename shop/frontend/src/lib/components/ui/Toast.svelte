<script lang="ts">
  import { toasts } from '../../stores/toast';
  import { fly, fade } from 'svelte/transition';
  import { icons } from '../../icons';
  
  let toastList = $derived($toasts);
  
  const colors = {
    success: 'bg-green-500/90 text-white',
    error: 'bg-red-500/90 text-white',
    warning: 'bg-yellow-500/90 text-white',
    info: 'bg-blue-500/90 text-white',
  };
</script>

<div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
  {#each toastList as toast (toast.id)}
    <div
      in:fly={{ x: 50, duration: 300 }}
      out:fade={{ duration: 200 }}
      class="{colors[toast.type]} px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[250px] pointer-events-auto backdrop-blur-sm border border-white/10"
    >
      <div class="w-5 h-5">
        {#if toast.type === 'success'}
          {@html icons.check}
        {:else if toast.type === 'error'}
          {@html icons.close}
        {:else if toast.type === 'warning'}
          {@html icons.help}
        {:else}
          {@html icons.info || icons.help}
        {/if}
      </div>
      <span class="text-sm font-medium">{toast.message}</span>
      <button 
        class="ml-auto w-4 h-4 opacity-70 hover:opacity-100 transition-opacity"
        onclick={() => toasts.remove(toast.id)}
      >
        {@html icons.close}
      </button>
    </div>
  {/each}
</div>
