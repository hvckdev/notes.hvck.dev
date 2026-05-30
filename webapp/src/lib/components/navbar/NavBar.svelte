<script lang="ts">
	import { onMount } from 'svelte';
	import ThemeToggle from './ThemeToggle.svelte';

	export let dark: boolean;
</script>

<div class="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-4">
	<div
		id="navbar"
		class="h-14 glass-strong rounded-2xl transition-colors"
	>
		<div
			id="navbar-content"
			class="h-full px-5 md:px-6 max-w-6xl mx-auto flex items-center justify-between whitespace-nowrap"
		>
			<a href="/" class="self-center">
				<span id="name" class="self-center font-semibold text-lg dark:text-white"
					>{import.meta.env.VITE_BRANDING || 'notes.hvck.dev'}</span
				>
			</a>

			<ThemeToggle bind:dark />
		</div>
	</div>
</div>
