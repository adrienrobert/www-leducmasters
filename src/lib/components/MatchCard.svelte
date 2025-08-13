<script lang="ts">
	import { Check, X, Clock, Trophy } from 'lucide-svelte';
	import type { MatchWithDetails } from '$lib/types.js';
	import { addToast } from '$lib/stores/index.js';

	interface Props {
		match: MatchWithDetails;
		onScoreUpdate: (updatedTournament: any) => void;
	}

	let { match, onScoreUpdate }: Props = $props();
	
	let showScoreInput = $state(false);
	let scoreA = $state(match.scoreA ?? 0);
	let scoreB = $state(match.scoreB ?? 0);
	let loading = $state(false);

	const canEnterScore = () => {
		return match.playerAId && match.playerBId && !match.locked;
	};

	const getMatchStatus = () => {
		if (match.winnerId) return 'completed';
		if (match.playerAId && match.playerBId) return 'ready';
		if (match.playerAId || match.playerBId) return 'partial';
		return 'waiting';
	};

	const getStatusIcon = () => {
		switch (getMatchStatus()) {
			case 'completed':
				return Check;
			case 'ready':
				return Clock;
			default:
				return null;
		}
	};

	const getStatusColor = () => {
		switch (getMatchStatus()) {
			case 'completed':
				return 'text-green-600';
			case 'ready':
				return 'text-blue-600';
			case 'partial':
				return 'text-amber-600';
			default:
				return 'text-gray-400';
		}
	};

	const handleScoreSubmit = async () => {
		if (scoreA === scoreB) {
			addToast({
				type: 'error',
				message: 'Les scores ne peuvent pas être égaux'
			});
			return;
		}

		loading = true;

		try {
			const response = await fetch(`/api/matches/${match.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ scoreA, scoreB })
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error?.message || 'Erreur lors de la mise à jour du score');
			}

			onScoreUpdate(result.data);
			showScoreInput = false;

			addToast({
				type: 'success',
				message: 'Score enregistré avec succès'
			});
		} catch (error) {
			addToast({
				type: 'error',
				message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du score'
			});
		} finally {
			loading = false;
		}
	};

	const handleCancelScore = () => {
		scoreA = match.scoreA ?? 0;
		scoreB = match.scoreB ?? 0;
		showScoreInput = false;
	};

	const openScoreInput = () => {
		if (!canEnterScore()) return;
		showScoreInput = true;
	};
</script>

<div class="bg-white rounded-xl border border-gray-200 p-4 relative">
	<!-- Badge de statut -->
	<div class="absolute top-3 right-3">
		{#if getStatusIcon()}
			{@const StatusIcon = getStatusIcon()}
			<div class="p-1 rounded-full {getStatusColor()} bg-gray-50">
				<StatusIcon class="w-4 h-4" />
			</div>
		{/if}
	</div>

	<!-- Informations du match -->
	<div class="mb-4">
		<div class="text-xs text-gray-500 mb-2">
			{match.bracket === 'MAIN' ? 'Main Bracket' : 
			 match.bracket === 'LOSER' ? 'Loser Bracket' :
			 match.bracket === 'PLAYOFF' ? 'Playoff' : 'Grande Finale'} 
			- Round {match.roundNumber}
		</div>
	</div>

	<!-- Joueurs et scores -->
	<div class="space-y-3">
		<!-- Joueur A -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3 flex-1">
				<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
					<span class="text-sm font-medium text-blue-600">
						{match.playerA?.name?.[0] || '?'}
					</span>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-gray-900 truncate">
						{match.playerA?.name || 'TBD'}
					</p>
				</div>
				{#if match.winnerId === match.playerAId}
					<Trophy class="w-4 h-4 text-yellow-500" />
				{/if}
			</div>
			<div class="text-right">
				{#if showScoreInput && canEnterScore()}
					<input
						type="number"
						bind:value={scoreA}
						min="0"
						class="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				{:else}
					<span class="text-lg font-bold text-gray-900">
						{match.scoreA ?? '-'}
					</span>
				{/if}
			</div>
		</div>

		<!-- Séparateur -->
		<div class="border-t border-gray-100"></div>

		<!-- Joueur B -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3 flex-1">
				<div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
					<span class="text-sm font-medium text-red-600">
						{match.playerB?.name?.[0] || '?'}
					</span>
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-gray-900 truncate">
						{match.playerB?.name || 'TBD'}
					</p>
				</div>
				{#if match.winnerId === match.playerBId}
					<Trophy class="w-4 h-4 text-yellow-500" />
				{/if}
			</div>
			<div class="text-right">
				{#if showScoreInput && canEnterScore()}
					<input
						type="number"
						bind:value={scoreB}
						min="0"
						class="w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				{:else}
					<span class="text-lg font-bold text-gray-900">
						{match.scoreB ?? '-'}
					</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Actions -->
	<div class="mt-4 pt-3 border-t border-gray-100">
		{#if showScoreInput}
			<div class="flex gap-2">
				<button
					onclick={handleCancelScore}
					disabled={loading}
					class="flex-1 py-2 px-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
				>
					Annuler
				</button>
				<button
					onclick={handleScoreSubmit}
					disabled={loading || scoreA === scoreB}
					class="flex-1 py-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
				>
					{loading ? 'Enregistrement...' : 'Valider'}
				</button>
			</div>
		{:else if canEnterScore()}
			<button
				onclick={openScoreInput}
				class="w-full py-2 px-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
			>
				Saisir le score
			</button>
		{:else if match.winnerId}
			<div class="text-center text-sm text-green-600 font-medium">
				Match terminé
			</div>
		{:else}
			<div class="text-center text-sm text-gray-500">
				En attente des joueurs
			</div>
		{/if}
	</div>
</div>
