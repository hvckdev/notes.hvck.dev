<script lang="ts">
	import { browser } from '$app/environment';

	import Footer from '$lib/components/Footer.svelte';
	import NavBar from '$lib/components/navbar/NavBar.svelte';
	import ThemeToggle from '$lib/components/navbar/ThemeToggle.svelte';
	import '../app.css';

	let dark: boolean;
	let darkTheme = 'dark';

	$: getTheme();

	$: {
		if (browser) {
			window.localStorage.setItem('isDarkMode', String(dark));
		}
	}

	async function getTheme() {
		if (browser) {
			const savedMode = window.localStorage.getItem('isDarkMode');
			dark = savedMode
				? savedMode === 'true'
				: savedMode === 'false'
				? false
				: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
			window.localStorage.setItem('isDarkMode', String(dark));
		}
	}
</script>

<svelte:head>
	<title>{import.meta.env.VITE_BRANDING}.</title>
	<meta name="title" content="notes.hvck.space - my notes" />
	<meta
		name="description"
		content="shared note"
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://notes.hvck.dev/" />
	<meta property="og:title" content="notes.hvck.dev ~ my notes" />
	<meta
		property="og:description"
		content="shared note"
	/>

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://notes.hvck.dev/" />
	<meta property="twitter:title" content="notes.hvck.dev — my notes" />
	<meta
		property="twitter:description"
		content="shared note"
	/>
</svelte:head>

<div class=" h-full {dark !== undefined ? '' : 'hidden'} {dark ? darkTheme : ''}">
	<div class="bg-white dark:bg-zinc-900 min-h-full transition-colors">
		<div class="z-50 sticky top-0 w-full bg-white dark:bg-zinc-900 transition-colors">
			<div class="top-0 left-0 right-0">
				<NavBar>
					<svelte:fragment slot="left" />
					<svelte:fragment slot="right">
						<ThemeToggle bind:dark />
					</svelte:fragment>
					></NavBar
				>
			</div>
		</div>

		<div class="container mx-auto max-w-4xl mx-auto mt-6 md:mt-12 px-4 2xl:px-0 ">
			<slot />
			<div class="mt-12">
				<Footer />
			</div>
		</div>
	</div>
</div>
