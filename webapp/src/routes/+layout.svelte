<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	import Footer from '$lib/components/Footer.svelte';
	import NavBar from '$lib/components/navbar/NavBar.svelte';
	import ScrollToTop from '$lib/components/ScrollToTop.svelte';
	import '../app.css';

	let dark = false;
	let mounted = false;
	let darkTheme = 'dark';

	onMount(() => {
		const savedMode = window.localStorage.getItem('isDarkMode');
		dark = savedMode !== null
			? savedMode === 'true'
			: window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
		mounted = true;
	});

	$: if (browser && mounted) {
		window.localStorage.setItem('isDarkMode', String(dark));
	}
</script>

<svelte:head>
	<title>hvck / notes</title>
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

<div class="min-h-screen gradient-bg flex flex-col {dark ? darkTheme : ''}">
	<NavBar bind:dark />

	<div class="flex-1 container mx-auto max-w-5xl mt-6 md:mt-12 px-4 2xl:px-0">
		<slot />
	</div>

	<div class="container mx-auto max-w-5xl px-4 2xl:px-0 pb-6 pt-8">
		<Footer />
	</div>
</div>

<ScrollToTop />
