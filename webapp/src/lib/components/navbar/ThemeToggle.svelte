<script lang="ts">
	import DarkIcon from 'svelte-icons/io/IoMdMoon.svelte';
	import LightIcon from 'svelte-icons/io/IoMdSunny.svelte';

	export let dark: boolean;

	function onClick() {
		dark = !dark;
	}
</script>

<button
	on:click={onClick}
	class="py-4 px-3 md:py-0 md:px-0 self-center w-full h-full text-zinc-700 dark:text-zinc-200 md:dark:text-zinc-300
	rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition-colors min-h-[44px]"
>
	<span class="flex md:block justify-center items-center gap-2">
		<span class="whitespace-nowrap text-zinc-800 dark:text-zinc-200 md:hidden">Toggle dark mode</span>
		<div class="h-full flex flex-col justify-center">
			<span class="inline-block w-6 h-6 text-zinc-700 dark:text-zinc-300">
				{#if dark}
					<LightIcon />
				{:else}
					<DarkIcon />
				{/if}
			</span>
		</div>
	</span>
</button>
