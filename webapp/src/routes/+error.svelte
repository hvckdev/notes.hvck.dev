<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex min-h-[60vh] items-center justify-center px-4">
	<div
		class="glass w-full max-w-2xl rounded-2xl px-6 py-8 text-zinc-700 shadow-sm dark:text-zinc-300 md:px-10 md:py-10"
	>
		<p class="text-sm font-medium tracking-wide text-zinc-500 dark:text-zinc-400">Error {$page.status}</p>

		{#if $page.status === 404}
			<h1 class="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
				Note not found
			</h1>
			<p class="mt-4 text-lg leading-8">This link does not point to an available note.</p>
		{:else if $page.status === 410 && $page.error?.message === 'Note expired'}
			<h1 class="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
				This note has expired
			</h1>
			<p class="mt-4 text-lg leading-8">
				Notes are only available for a limited time. This one has expired or was removed after a period of inactivity.
			</p>
		{:else if $page.status === 410 && $page.error?.message === 'Note deleted'}
			<h1 class="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
				This note was deleted
			</h1>
			<p class="mt-4 text-lg leading-8">The person who shared this note has removed it.</p>
		{:else}
			<h1 class="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white md:text-4xl">
				Unable to load this page
			</h1>
			{#if import.meta.env.DEV}
				<pre class="mt-4 overflow-x-auto rounded-lg bg-zinc-950/5 p-4 text-sm leading-6 dark:bg-white/10">{JSON.stringify($page.error, null, 2)}</pre>
			{:else}
				<p class="mt-4 text-lg leading-8">An unexpected error occurred. Please try again later.</p>
			{/if}
		{/if}

		<div class="mt-10 flex w-full justify-center">
			{#if $page.status === 404 || ($page.status === 410 && $page.error?.message === 'Note expired')}
				<img src="/expired_note.svg" alt="Illustration of an unavailable note" class="w-64 md:w-80" />
			{:else if $page.status === 410 && $page.error?.message === 'Note deleted'}
				<img src="/deleted_note.svg" alt="Illustration of a deleted note" class="w-64 md:w-80" />
			{/if}
		</div>
	</div>
</div>
