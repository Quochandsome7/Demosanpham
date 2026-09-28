<script lang="ts">
  let { columns, data, loading, onRowClick = undefined } = $props<{
    columns: { key: string; label: string; render?: (row: any) => string; class?: string }[];
    data: any[];
    loading?: boolean;
    onRowClick?: (row: any) => void;
  }>();
</script>

<div class="w-full overflow-x-auto rounded-xl border border-dark-800 bg-dark-900/50 backdrop-blur-sm">
  <table class="w-full text-left text-sm text-gray-300">
    <thead class="bg-dark-800/50 text-xs uppercase text-gray-400 border-b border-dark-800">
      <tr>
        {#each columns as col}
          <th scope="col" class="px-6 py-4 font-medium {col.class || ''}">{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-dark-800">
      {#if loading}
        {#each Array(5) as _}
          <tr class="animate-pulse">
            {#each columns as col}
              <td class="px-6 py-4">
                <div class="h-4 bg-dark-700 rounded w-2/3"></div>
              </td>
            {/each}
          </tr>
        {/each}
      {:else if data && data.length > 0}
        {#each data as row}
          <tr 
            class="hover:bg-dark-800/50 transition-colors duration-150 {onRowClick ? 'cursor-pointer' : ''}"
            onclick={() => onRowClick && onRowClick(row)}
          >
            {#each columns as col}
              <td class="px-6 py-4 whitespace-nowrap {col.class || ''}">
                {#if col.render}
                  {@html col.render(row)}
                {:else}
                  {row[col.key]}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      {:else}
        <tr>
          <td colspan={columns.length} class="px-6 py-12 text-center text-gray-500">
            <div class="flex flex-col items-center justify-center">
              <svg class="w-12 h-12 mb-4 text-dark-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
              <p>Không có dữ liệu</p>
            </div>
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>
