<script lang="ts">
	export let href: string = '/';
</script>

<a
	{href}
	class="text-center py-3 px-3 md:py-0 md:px-0 self-center w-full h-full text-zinc-700
	dark:text-zinc-200 md:dark:text-zinc-300 rounded-lg
	hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
>
	<div class="h-full flex flex-col justify-center min-h-[44px]">
		<slot />
	</div>
</a>
