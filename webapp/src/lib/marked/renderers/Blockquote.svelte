<script lang="ts">
	import Callout from '../../components/Callout.svelte';

	export let raw: string;

	const calloutMatch = raw.split('\n')[0].match(/^>\s?\[!(.+?)\]([+-]?)(?:\s(.*))?$/);
	let isCallout: boolean = calloutMatch != null;
	let type = calloutMatch?.[1]?.trim() ?? 'note';
	let title = calloutMatch?.[3]?.trim();
</script>

{#if isCallout}
	<Callout {type} {title}>
		<slot />
	</Callout>
{:else}
	<p
		class="glass-subtle rounded-xl ml-4 px-4 py-2 prose-p:my-2 prose-p:mx-2 border-l-4 border-zinc-300 dark:border-zinc-500"
	>
		<slot />
	</p>
{/if}
