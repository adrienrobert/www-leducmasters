<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Plus, Calendar, MapPin, Users, Trophy, MoreVertical, Trash2, Share2 } from 'lucide-svelte';
	import { formatDate, formatShortDate } from '$lib/types.js';
	import { addToast } from '$lib/stores/index.js';
	import type { TournamentWithDetails } from '$lib/types.js';

	let { data } = $props();
	let tournaments: TournamentWithDetails[] = $state(data.tournaments);
	let showMenu: string | null = $state(null);

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

	const handleCreateTournament = () => {
		goto('/tournaments/create');
	};

	const handleOpenTournament = (id: string) => {
		goto(`/tournaments/${id}`);
	};

	const handleDeleteTournament = async (id: string) => {
		if (!confirm('Êtes-vous sûr de vouloir supprimer ce tournoi ?')) {
			return;
		}

		try {
			const response = await fetch(`/api/tournaments/${id}`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Erreur lors de la suppression');
			}

			tournaments = tournaments.filter(t => t.id !== id);
			addToast({
				type: 'success',
				message: 'Tournoi supprimé avec succès'
			});
		} catch (error) {
			addToast({
				type: 'error',
				message: 'Erreur lors de la suppression du tournoi'
			});
		}
	};

	const handleShareTournament = async (id: string, title: string) => {
		const url = `${window.location.origin}/tournaments/${id}`;
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
		showMenu = null;
	};

	const toggleMenu = (tournamentId: string) => {
		showMenu = showMenu === tournamentId ? null : tournamentId;
	};

	// Fermer le menu quand on clique ailleurs
	const handleClickOutside = (event: MouseEvent) => {
		if (!event.target || !(event.target as Element).closest('.tournament-menu')) {
			showMenu = null;
		}
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="p-4 pb-20">
	<!-- Header -->
	<header class="mb-6">
		<h1 class="text-2xl font-bold text-gray-900 mb-2">Leduc Masters</h1>
		<p class="text-gray-600">Gérez vos tournois en double élimination</p>
	</header>

	<!-- Liste des tournois -->
	{#if tournaments.length === 0}
		<div class="text-center py-12">
			<div class="mb-4">
				<Trophy class="w-16 h-16 text-gray-300 mx-auto" />
			</div>
			<h3 class="text-lg font-medium text-gray-900 mb-2">Aucun tournoi</h3>
			<p class="text-gray-500 mb-6">Créez votre premier tournoi pour commencer</p>
			<button
				onclick={handleCreateTournament}
				class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
			>
				<Plus class="w-5 h-5" />
				Créer un tournoi
			</button>
		</div>
	{:else}
		<div class="space-y-4">
			{#each tournaments as tournament (tournament.id)}
				<div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
					<!-- En-tête de la carte -->
					<div class="p-4">
						<div class="flex items-start justify-between mb-3">
							<div class="flex-1">
								<h3 class="text-lg font-semibold text-gray-900 mb-1">
									{tournament.title}
								</h3>
								<div class="flex items-center gap-3 text-sm text-gray-500">
									<div class="flex items-center gap-1">
										<Calendar class="w-4 h-4" />
										<span>{formatShortDate(new Date(tournament.date))}</span>
									</div>
									{#if tournament.location}
										<div class="flex items-center gap-1">
											<MapPin class="w-4 h-4" />
											<span>{tournament.location}</span>
										</div>
									{/if}
								</div>
							</div>
							
							<!-- Menu kebab -->
							<div class="relative tournament-menu">
								<button
									onclick={() => toggleMenu(tournament.id)}
									class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
								>
									<MoreVertical class="w-5 h-5 text-gray-400" />
								</button>
								
								{#if showMenu === tournament.id}
									<div class="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-40 z-10">
										<button
											onclick={() => handleShareTournament(tournament.id, tournament.title)}
											class="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
										>
											<Share2 class="w-4 h-4" />
											Partager
										</button>
										<button
											onclick={() => handleDeleteTournament(tournament.id)}
											class="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
										>
											<Trash2 class="w-4 h-4" />
											Supprimer
										</button>
									</div>
								{/if}
							</div>
						</div>

						<!-- Informations du tournoi -->
						<div class="flex items-center gap-4 mb-4">
							<div class="flex items-center gap-2">
								<Users class="w-4 h-4 text-gray-400" />
								<span class="text-sm text-gray-600">{tournament.players.length} participants</span>
							</div>
							
							<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusBadge(tournament.status)}">
								{getStatusText(tournament.status)}
							</span>
						</div>

						<!-- Barre de progression -->
						<div class="mb-4">
							<div class="flex items-center justify-between mb-2">
								<span class="text-sm font-medium text-gray-700">Progression</span>
								<span class="text-sm text-gray-500">{tournament.progress.percent}%</span>
							</div>
							<div class="w-full bg-gray-200 rounded-full h-2">
								<div 
									class="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style="width: {tournament.progress.percent}%"
								></div>
							</div>
							<div class="flex justify-between text-xs text-gray-500 mt-1">
								<span>{tournament.progress.played} joués</span>
								<span>{tournament.progress.total} total</span>
							</div>
						</div>

						<!-- Vainqueur si terminé -->
						{#if tournament.status === 'COMPLETED' && tournament.winner}
							<div class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
								<div class="flex items-center gap-2">
									<Trophy class="w-5 h-5 text-yellow-600" />
									<span class="text-sm font-medium text-yellow-800">
										Vainqueur : {tournament.winner.name}
									</span>
								</div>
							</div>
						{/if}

						<!-- Bouton d'action -->
						<button
							onclick={() => handleOpenTournament(tournament.id)}
							class="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
						>
							Ouvrir le tournoi
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Bouton flottant pour créer un tournoi -->
{#if tournaments.length > 0}
	<button
		onclick={handleCreateTournament}
		class="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
	>
		<Plus class="w-6 h-6" />
	</button>
{/if}
