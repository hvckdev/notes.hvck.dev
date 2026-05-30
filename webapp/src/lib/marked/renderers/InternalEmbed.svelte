<script lang="ts">
	import { Paperclip, HelpCircle } from 'lucide-svelte';

	export let text: string;
</script>

<div>
	<dfn class="not-italic" title="Interal embeds are not shared currently.">
		<div
			class="glass-subtle rounded-xl px-4 py-8 inline-flex flex-col items-center justify-center"
		>
			<span class="h-8 text-zinc-400 inline-flex items-center whitespace-nowrap gap-1.5"
				><Paperclip size={20} class="text-zinc-400" />
				<span>Internal embed</span>
			</span>
			<span class="underline cursor-not-allowed inline-flex items-center">
				<span class="text-[#705dcf] opacity-50">{text}</span>
				<HelpCircle size={10} class="text-zinc-400 ml-0.5 mb-1" />
			</span>
		</div>
	</dfn>
</div>
