<script lang="ts">
	import { Pencil, List, Info, ListChecks, Flame, Check, HelpCircle, AlertTriangle, X, AlertOctagon, Bug, Quote } from 'lucide-svelte';
	export let icon: string;
	export let size = 20;
</script>

{#if icon == 'note'}
	<Pencil {size} />
{:else if icon == 'summary'}
	<List {size} />
{:else if icon == 'info'}
	<Info {size} />
{:else if icon == 'todo'}
	<ListChecks {size} />
{:else if icon == 'hint'}
	<Flame {size} />
{:else if icon == 'success'}
	<Check {size} />
{:else if icon == 'question'}
	<HelpCircle {size} />
{:else if icon == 'warning'}
	<AlertTriangle {size} />
{:else if icon == 'fail'}
	<X {size} />
{:else if icon == 'error'}
	<AlertOctagon {size} />
{:else if icon == 'bug'}
	<Bug {size} />
{:else if icon == 'example'}
	<List {size} />
{:else if icon == 'quote'}
	<Quote {size} />
{:else}
	<Pencil {size} />
{/if}
