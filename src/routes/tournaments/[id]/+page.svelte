<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { 
		ArrowLeft, 
		Calendar, 
		MapPin, 
		Users, 
		Trophy, 
		RotateCcw, 
		Trash2, 
		MoreVertical,
		Share2
	} from 'lucide-svelte';
	import MatchCard from '$lib/components/MatchCard.svelte';
	import { formatDate } from '$lib/types.js';
	import { addToast } from '$lib/stores/index.js';
	import type { TournamentWithDetails, MatchWithDetails } from '$lib/types.js';

	let { data } = $props();
	let tournament = $state(data.tournament as TournamentWithDetails);
	let showMenu = $state(false);

	// Grouper les matchs par bracket et round
	const groupMatches = (matches: MatchWithDetails[]) => {
		const groups = {
			MAIN: {} as Record<number, MatchWithDetails[]>,
			LOSER: {} as Record<number, MatchWithDetails[]>,
			PLAYOFF: {} as Record<number, MatchWithDetails[]>,
			GRAND_FINAL: {} as Record<number, MatchWithDetails[]>
		};

		matches.forEach(match => {
			if (!groups[match.bracket][match.roundNumber]) {
				groups[match.bracket][match.roundNumber] = [];
			}
			groups[match.bracket][match.roundNumber].push(match);
		});

		// Trier chaque round par slotInRound
		Object.values(groups).forEach(bracket => {
			Object.values(bracket).forEach(round => {
				round.sort((a, b) => a.slotInRound - b.slotInRound);
			});
		});

		return groups;
	};

	let matchGroups = $derived(groupMatches(tournament.matches));

	const handleScoreUpdate = (updatedTournament: TournamentWithDetails) => {
		tournament = updatedTournament;
	};

	const handleResetTournament = async () => {
		if (!confirm('Êtes-vous sûr de vouloir réinitialiser ce tournoi ? Tous les scores seront perdus.')) {
			return;
		}

		try {
			const response = await fetch(`/api/tournaments/${tournament.id}/reset`, {
				method: 'POST'
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error?.message || 'Erreur lors de la réinitialisation');
			}

			tournament = result.data;
			addToast({
				type: 'success',
				message: 'Tournoi réinitialisé avec succès'
			});
		} catch (error) {
			addToast({
				type: 'error',
				message: error instanceof Error ? error.message : 'Erreur lors de la réinitialisation'
			});
		}
		showMenu = false;
	};

	const handleDeleteTournament = async () => {
		if (!confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.')) {
			return;
		}

		try {
			const response = await fetch(`/api/tournaments/${tournament.id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Erreur lors de la suppression');
			}

			addToast({
				type: 'success',
				message: 'Tournoi supprimé avec succès'
			});

			goto('/');
		} catch (error) {
			addToast({
				type: 'error',
				message: 'Erreur lors de la suppression du tournoi'
			});
		}
		showMenu = false;
	};

	const handleShareTournament = async () => {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			addToast({
				type: 'success',
				message: 'Lien copié dans le presse-papier'
			});
		} catch (error) {
			addToast({
				type: 'error',
				message: 'Impossible de copier le lien'
			});
		}
		showMenu = false;
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return 'bg-blue-100 text-blue-800';
			case 'COMPLETED':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'ACTIVE':
				return 'En cours';
			case 'COMPLETED':
				return 'Terminé';
			default:
				return 'Brouillon';
		}
	};

	// Fermer le menu quand on clique ailleurs
	const handleClickOutside = (event: MouseEvent) => {
		if (!event.target || !(event.target as Element).closest('.tournament-menu')) {
			showMenu = false;
		}
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header sticky -->
	<header class="sticky top-0 bg-white border-b border-gray-200 z-30">
		<div class="flex items-center justify-between p-4">
			<div class="flex items-center gap-3">
				<button 
					onclick={() => goto('/')}
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<ArrowLeft class="w-5 h-5 text-gray-600" />
				</button>
				<div>
					<h1 class="text-lg font-bold text-gray-900 truncate max-w-48">
						{tournament.title}
					</h1>
					<div class="flex items-center gap-2">
						<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadge(tournament.status)}">
							{getStatusText(tournament.status)}
						</span>
						<span class="text-xs text-gray-500">
							{tournament.progress.percent}% terminé
						</span>
					</div>
				</div>
			</div>

			<!-- Menu actions -->
			<div class="relative tournament-menu">
				<button
					onclick={() => showMenu = !showMenu}
					class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				>
					<MoreVertical class="w-5 h-5 text-gray-600" />
				</button>
				
				{#if showMenu}
					<div class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-48 z-10">
						<button
							onclick={handleShareTournament}
							class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
						>
							<Share2 class="w-4 h-4" />
							Partager
						</button>
						<button
							onclick={handleResetTournament}
							class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
						>
							<RotateCcw class="w-4 h-4" />
							Réinitialiser
						</button>
						<button
							onclick={handleDeleteTournament}
							class="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
						>
							<Trash2 class="w-4 h-4" />
							Supprimer
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Barre de progression -->
		<div class="px-4 pb-4">
			<div class="w-full bg-gray-200 rounded-full h-2">
				<div 
					class="bg-blue-600 h-2 rounded-full transition-all duration-300"
					style="width: {tournament.progress.percent}%"
				></div>
			</div>
		</div>
	</header>

	<div class="p-4 space-y-6">
		<!-- Informations du tournoi -->
		<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-3">Informations</h2>
			
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<Calendar class="w-5 h-5 text-gray-400" />
					<span class="text-sm text-gray-700">{formatDate(new Date(tournament.date))}</span>
				</div>
				
				{#if tournament.location}
					<div class="flex items-center gap-3">
						<MapPin class="w-5 h-5 text-gray-400" />
						<span class="text-sm text-gray-700">{tournament.location}</span>
					</div>
				{/if}
				
				<div class="flex items-center gap-3">
					<Users class="w-5 h-5 text-gray-400" />
					<span class="text-sm text-gray-700">{tournament.players.length} participants</span>
				</div>
			</div>

			<!-- Vainqueur si terminé -->
			{#if tournament.status === 'COMPLETED' && tournament.winner}
				<div class="mt-4 pt-4 border-t border-gray-100">
					<div class="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
						<Trophy class="w-6 h-6 text-yellow-600" />
						<div>
							<p class="text-sm font-medium text-yellow-800">Champion du tournoi</p>
							<p class="text-lg font-bold text-yellow-900">{tournament.winner.name}</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Main Bracket -->
		{#if Object.keys(matchGroups.MAIN).length > 0}
			<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Main Bracket</h2>
				
				<div class="overflow-x-auto">
					<div class="flex gap-4 min-w-max">
						{#each Object.entries(matchGroups.MAIN) as [round, matches]}
							<div class="flex-shrink-0 w-72">
								<h3 class="text-sm font-medium text-gray-500 mb-3 text-center">
									Round {round}
								</h3>
								<div class="space-y-3">
									{#each matches as match (match.id)}
										<MatchCard {match} onScoreUpdate={handleScoreUpdate} />
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Loser Bracket -->
		{#if Object.keys(matchGroups.LOSER).length > 0}
			<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Loser Bracket</h2>
				
				<div class="overflow-x-auto">
					<div class="flex gap-4 min-w-max">
						{#each Object.entries(matchGroups.LOSER) as [round, matches]}
							<div class="flex-shrink-0 w-72">
								<h3 class="text-sm font-medium text-gray-500 mb-3 text-center">
									Round {round}
								</h3>
								<div class="space-y-3">
									{#each matches as match (match.id)}
										<MatchCard {match} onScoreUpdate={handleScoreUpdate} />
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Playoff -->
		{#if Object.keys(matchGroups.PLAYOFF).length > 0}
			<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Playoff</h2>
				<p class="text-sm text-gray-600 mb-4">
					Gagnant du Loser Bracket vs Perdant de la finale du Main Bracket
				</p>
				
				<div class="max-w-sm">
					{#each Object.entries(matchGroups.PLAYOFF) as [round, matches]}
						<div class="space-y-3">
							{#each matches as match (match.id)}
								<MatchCard {match} onScoreUpdate={handleScoreUpdate} />
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Grande Finale -->
		{#if Object.keys(matchGroups.GRAND_FINAL).length > 0}
			<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
				<h2 class="text-lg font-semibold text-gray-900 mb-4">Grande Finale</h2>
				<p class="text-sm text-gray-600 mb-4">
					Gagnant du Main Bracket vs Gagnant du Playoff
				</p>
				
				<div class="max-w-sm">
					{#each Object.entries(matchGroups.GRAND_FINAL) as [round, matches]}
						<div class="space-y-3">
							{#each matches as match (match.id)}
								<MatchCard {match} onScoreUpdate={handleScoreUpdate} />
							{/each}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Participants -->
		<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Participants</h2>
			
			<div class="grid grid-cols-2 gap-3">
				{#each tournament.players as participant (participant.id)}
					<div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
						<div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
							<span class="text-sm font-medium text-blue-600">
								{participant.player.name[0]}
							</span>
						</div>
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium text-gray-900 truncate">
								{participant.player.name}
							</p>
							<p class="text-xs text-gray-500">Seed {participant.seed}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
