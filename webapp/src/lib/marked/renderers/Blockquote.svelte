<script lang="ts">
	import Callout from '../../components/Callout.svelte';

	export let raw: string;

	let isCallout: boolean = raw.split('\n')[0].match(/>\s?\[!(.+)\]([+-]?)(\s.*|$)/) != null;
</script>

{#if isCallout}
	<Callout>
		<slot />
	</Callout>
{:else}
	<p
		class="glass-subtle rounded-xl ml-4 px-4 py-2 prose-p:my-2 prose-p:mx-2 border-l-4 border-zinc-300 dark:border-zinc-500"
	>
		<slot />
	</p>
{/if}
