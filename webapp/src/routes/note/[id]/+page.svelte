<script lang="ts">
	import { onMount } from 'svelte';
	import { decrypt } from '$lib/crypto/decrypt';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';
	import { FileText, Lock, FileCode } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import RawRenderer from '$lib/components/RawRenderer.svelte';
	import Dismissable from '$lib/components/Dismissable.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	let { note } = data;

	let plaintext: string;
	let timeString: string;
	let decryptFailed = false;
	let showRaw = false;
	let fileTitle: string | undefined;

	function toggleRaw() {
		showRaw = !showRaw;
	}

	function msToString(ms: number): string {
		const minutes = ms / 1000 / 60;
		if (minutes < 60) {
			return `${Math.floor(minutes)} minute${minutes >= 2 ? 's' : ''}`;
		}
		const hours = minutes / 60;
		if (hours < 24) {
			return `${Math.floor(hours)} hour${hours >= 2 ? 's' : ''}`;
		}
		const days = hours / 24;
		if (days < 30.42) {
			return `${Math.floor(days)} day${days >= 2 ? 's' : ''}`;
		}
		const months = days / 30.42;
		return `${Math.floor(months)} month${months >= 2 ? 's' : ''}`;
	}

	function parsePayload(payload: string): { body: string; title?: string } {
		try {
			const parsed = JSON.parse(payload);
			return { body: parsed?.body, title: parsed?.title };
		} catch (e) {
			return { body: payload, title: undefined };
		}
	}

	onMount(() => {
		if (browser && note) {
			const key = location.hash.slice(1);
			decrypt({ ...note, key }, note.crypto_version)
				.then((value) => {
					const { body, title } = parsePayload(value);
					plaintext = body;
					fileTitle = title;
				})
				.catch(() => (decryptFailed = true));
		}
	});

	$: if (note?.insert_time) {
		const diff_ms = new Date().valueOf() - new Date(note.insert_time).valueOf();
		timeString = msToString(diff_ms);
	}
</script>

<svelte:head>
	<title>hvck / notes | Shared note</title>
	{#if decryptFailed}
		<title>hvck / notes | Error decrypting note</title>
	{/if}
</svelte:head>

{#if plaintext}
	<div class="mx-3 md:mx-6">
		<Dismissable />

		<div
			class="mb-6 text-sm flex gap-3 flex-col md:gap-0 md:flex-row justify-between items-start md:items-center glass-subtle rounded-2xl px-4 py-3 text-zinc-600 dark:text-zinc-300"
		>
			<span class="flex gap-1.5 items-center uppercase">
				<Lock size={14} />
				<span>e2e encrypted | <span>Shared {timeString} ago</span></span>
			</span>
			<button
				on:click={toggleRaw}
				class="flex flex-row-reverse justify-end md:flex-row gap-1.5 uppercase items-center hover:underline min-h-[44px]"
			>
				{#if showRaw}
					<FileText size={16} />
					<span>Render Document</span>
				{:else}
					<span>Raw Markdown</span>
					<FileCode size={16} />
				{/if}
			</button>
		</div>

		<div class="glass rounded-2xl px-4 py-6 md:px-8 md:py-8">
			{#if showRaw}
				<RawRenderer>{plaintext}</RawRenderer>
			{:else}
				<MarkdownRenderer {plaintext} {fileTitle} />
			{/if}
		</div>
	</div>
{/if}

{#if decryptFailed}
	<div class="prose prose-zinc dark:prose-invert glass rounded-2xl px-6 py-8 md:px-10 md:py-10">
		<h1>Error: Cannot decrypt file 🔒</h1>
		<p class="prose-xl">This note could not be decrypted with this link.</p>
		<p class="prose-xl">
			If you think this is an error, please double check that you copied the entire URL.
		</p>
	</div>
{/if}
