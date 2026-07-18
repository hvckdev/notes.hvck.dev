<script lang="ts">
	import { getCalloutColor, getCalloutIcon } from '$lib/util/callout';
	import CalloutIcon from '$lib/components/CalloutIcon.svelte';

	export let title: string | undefined = undefined;
	export let type = 'note';
	let color = '--callout-warning';
	let icon = 'note';

	let content: HTMLElement;

	$: if (content) {
		const titleElement = content.getElementsByTagName('p')[0];
		const preFilled = title !== undefined;
		const match = titleElement?.innerText.split('\n')[0].match(/\[!(.+)\]([+-]?)(?:\s(.+))?/);
		if (match && !preFilled) {
			type = match[1]?.trim();
			title = match[3]?.trim() ?? type[0].toUpperCase() + type.substring(1).toLowerCase();
		}

		color = `--${getCalloutColor(type)}`;
		icon = getCalloutIcon(type);

		if (titleElement) {
			removeCalloutMarker(titleElement);
		}
	}

	function removeCalloutMarker(titleElement: HTMLParagraphElement) {
		const markerPattern = /^\s*\[!.+?\][+-]?(?:\s.*)?/;
		for (const node of Array.from(titleElement.childNodes)) {
			if (node.nodeType !== Node.TEXT_NODE) {
				break;
			}

			const text = node.textContent ?? '';
			if (!markerPattern.test(text)) {
				continue;
			}

			const nextLineStart = text.indexOf('\n');
			if (nextLineStart >= 0) {
				node.textContent = text.substring(nextLineStart + 1);
			} else {
				node.textContent = '';
			}
			break;
		}
	}
</script>

<div
	style="--callout-color: var({color})"
	class="border-l-4 border-l-callout glass-subtle rounded-xl my-4 overflow-hidden"
>
	<div class="p-[10px] bg-callout-bg flex items-center gap-2">
		<span class="callout-icon font-bold text-md text-callout h-5 w-5 inline-block"
			><CalloutIcon {icon} /></span
		>
		<span class="callout-title font-bold text-md">{title}</span>
	</div>
	<div bind:this={content} class="callout-content prose-p:my-0 prose-p:mx-0 py-4 px-3">
		<slot />
	</div>
</div>
