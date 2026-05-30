<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let visible = false;

	onMount(() => {
		if (!browser) return;

		const handleScroll = () => {
			const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
			if (scrollHeight <= 0) {
				visible = false;
				return;
			}
			visible = window.scrollY > scrollHeight * 0.5;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

{#if visible}
	<button
		on:click={scrollToTop}
		class="fixed right-3 md:right-6 bottom-6 z-40 w-10 h-10 rounded-full glass
		flex items-center justify-center text-zinc-600 dark:text-zinc-300
		hover:bg-white/40 dark:hover:bg-white/10 transition-all"
		aria-label="Scroll to top"
	>
		<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
	</button>
{/if}
