<script>
	import Tile from '$lib/components/index/tile.svelte';
</script>

<svelte:head>
	<title>{import.meta.env.VITE_BRANDING || 'notes.hvck.dev'}</title
	>
</svelte:head>

<div class="flex items-center justify-center min-h-[70vh]">
	<article class="glass rounded-3xl px-8 py-12 md:px-16 md:py-16 max-w-lg mx-auto text-center">
		<p class="text-zinc-800 dark:text-zinc-100 text-lg md:text-xl">I share my notes here :)</p>
	</article>
</div>
