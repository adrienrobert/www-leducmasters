<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { toasts, removeToast } from '$lib/stores/index.js';
	import { fade, fly } from 'svelte/transition';
	import { CheckCircle, XCircle, Info, X } from 'lucide-svelte';
	import type { Toast } from '$lib/stores/index.js';

	let { children } = $props();

	const getIcon = (type: Toast['type']) => {
		switch (type) {
			case 'success': return CheckCircle;
			case 'error': return XCircle;
			case 'info': return Info;
			default: return Info;
		}
	};

	const getColorClasses = (type: Toast['type']) => {
		switch (type) {
			case 'success': return 'bg-green-500 text-white';
			case 'error': return 'bg-red-500 text-white';
			case 'info': return 'bg-blue-500 text-white';
			default: return 'bg-gray-500 text-white';
		}
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Ping Pong Tournois</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 max-w-lg mx-auto">
	{@render children?.()}
</main>

<!-- Toasts Container -->
{#if $toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
		{#each $toasts as toast (toast.id)}
			<div 
				transition:fly={{ y: 50, duration: 300 }}
				class="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg {getColorClasses(toast.type)}"
			>
				<svelte:component this={getIcon(toast.type)} class="w-5 h-5 flex-shrink-0" />
				<p class="flex-1 text-sm font-medium">{toast.message}</p>
				<button 
					onclick={() => removeToast(toast.id)}
					class="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>
		{/each}
	</div>
{/if}
