<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { decryptAttachment } from '$lib/crypto/attachments';

	export let attachmentId: string;
	export let alt = '';
	export let mimeType = 'image/*';
	export let noteKey = '';

	let imageUrl: string | undefined;
	let failed = false;

	onMount(async () => {
		try {
			const response = await fetch(`/api/note/attachment/${attachmentId}`);
			if (!response.ok) throw new Error('Attachment not found');
			const attachment = await response.json();
			const plaintext = await decryptAttachment(noteKey, attachment.ciphertext, attachment.iv);
			imageUrl = URL.createObjectURL(new Blob([plaintext], { type: mimeType }));
		} catch {
			failed = true;
		}
	});

	onDestroy(() => {
		if (imageUrl) URL.revokeObjectURL(imageUrl);
	});
</script>

{#if imageUrl}
	<img src={imageUrl} {alt} class="max-w-full rounded-lg" />
{:else if failed}
	<p class="text-sm text-zinc-500">Unable to decrypt image: {alt || attachmentId}</p>
{:else}
	<p class="text-sm text-zinc-500">Decrypting image…</p>
{/if}
