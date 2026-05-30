<script lang="ts">
	import { HelpCircle } from 'lucide-svelte';

	export let text: string = '';
	export let displayText: string = '';
	export let useSlot = false;

	if (!displayText) {
		const aliasMatch = text.match(/^(?:.+)\|(.*)$/);
		const headerMatch = text.match(/^(.[^|]+)\#(.[^|]*)$/);
		if (aliasMatch) {
			displayText = aliasMatch[1];
		} else if (headerMatch) {
			displayText = `${headerMatch[1]} > ${headerMatch[2]}`;
		} else {
			displayText = text;
		}
	}
</script>

<dfn class="not-italic" title="Internal link">
	<span class="underline cursor-not-allowed inline-flex items-center">
		<span class="internal-link text-[#705dcf] opacity-50">
			{#if useSlot}
				<slot />
			{:else}
				{displayText}
			{/if}
		</span>
		<HelpCircle size={10} class="text-zinc-400 ml-0.5 mb-1" />
	</span>
</dfn>
