<script lang="ts">
  import { api } from '$lib/api';
  import { addToast } from '$lib/stores/toast';

  let { currentImage = '', onUpload } = $props<{
    currentImage?: string;
    onUpload: (url: string) => void;
  }>();

  let inputUrl = $state(currentImage || '');
  let loading = $state(false);
  let error = $state('');

  $effect(() => {
    if (currentImage !== inputUrl && !loading) {
      inputUrl = currentImage || '';
    }
  });

  async function handleConfirm() {
    error = '';
    if (!inputUrl.trim()) {
      error = 'Vui lòng nhập đường dẫn hình ảnh';
      return;
    }

    try {
      new URL(inputUrl);
    } catch {
      error = 'Đường dẫn không hợp lệ';
      return;
    }

    loading = true;
    try {
      const res = await api.uploadImage(inputUrl);
      if (res.success) {
        onUpload(res.data.url);
        addToast('Cập nhật hình ảnh thành công', 'success');
      } else {
        error = res.error || 'Có lỗi xảy ra';
      }
    } catch (e: any) {
      error = e.message || 'Lỗi kết nối';
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex gap-2">
    <div class="flex-1">
      <input
        type="text"
        bind:value={inputUrl}
        placeholder="Paste link from Unsplash, Google Photos, or any image URL"
        class="w-full px-4 py-2 bg-dark-800 border {error ? 'border-red-500' : 'border-dark-700'} rounded-xl text-white outline-none focus:border-cyan-500 transition-colors"
      />
      {#if error}
        <p class="text-red-400 text-sm mt-1">{error}</p>
      {/if}
    </div>
    <button
      onclick={handleConfirm}
      disabled={loading}
      class="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {#if loading}
        <span class="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
      {:else}
        Xác nhận
      {/if}
    </button>
  </div>

  <div class="text-xs text-gray-400">
    Gợi ý nguồn ảnh miễn phí: 
    <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">Unsplash</a>, 
    <a href="https://pexels.com" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline">Pexels</a>
  </div>

  {#if currentImage || inputUrl}
    <div class="mt-4 relative group rounded-2xl overflow-hidden border border-dark-700 bg-dark-800 aspect-video flex items-center justify-center">
      {#if !error}
        <img
          src={inputUrl || currentImage}
          alt="Preview"
          class="max-w-full max-h-full object-contain"
          onerror={() => error = 'Không thể tải hình ảnh từ đường dẫn này'}
        />
      {:else}
        <div class="text-gray-500 flex flex-col items-center">
          <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p>Hình ảnh không hợp lệ</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
