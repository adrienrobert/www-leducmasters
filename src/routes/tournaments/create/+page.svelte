<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, Plus, Users, AlertTriangle, Calendar, MapPin, User } from 'lucide-svelte';
	import { createTournamentSchema, isPowerOfTwo } from '$lib/types.js';
	import { addToast } from '$lib/stores/index.js';
	import type { PlayerWithTournaments } from '$lib/types.js';

	let { data } = $props();
	let players: PlayerWithTournaments[] = $state(data.players);
	let loading = $state(false);

	// État du formulaire
	let formData = $state({
		title: '',
		location: '',
		date: new Date().toISOString().split('T')[0],
		selectedPlayerIds: [] as string[]
	});

	let errors = $state({
		title: '',
		date: '',
		players: ''
	});

	let showAddPlayer = $state(false);
	let newPlayerName = $state('');

	// Calculs réactifs
	$effect(() => {
		// Validation en temps réel pour les joueurs
		if (formData.selectedPlayerIds.length === 0) {
			errors.players = 'Sélectionnez au moins 4 joueurs';
		} else if (formData.selectedPlayerIds.length < 4) {
			errors.players = 'Minimum 4 joueurs requis';
		} else if (!isPowerOfTwo(formData.selectedPlayerIds.length)) {
			errors.players = 'Le nombre de joueurs doit être une puissance de 2 (4, 8, 16, 32...)';
		} else {
			errors.players = '';
		}
	});

	const togglePlayerSelection = (playerId: string) => {
		if (formData.selectedPlayerIds.includes(playerId)) {
			formData.selectedPlayerIds = formData.selectedPlayerIds.filter(id => id !== playerId);
		} else {
			formData.selectedPlayerIds = [...formData.selectedPlayerIds, playerId];
		}
	};

	const handleAddPlayer = async () => {
		if (!newPlayerName.trim()) return;

		try {
			const response = await fetch('/api/players', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: newPlayerName.trim() })
			});

			const result = await response.json();

			if (!result.success) {
				throw new Error(result.error?.message || 'Erreur lors de la création du joueur');
			}

			players = [...players, result.data];
			formData.selectedPlayerIds = [...formData.selectedPlayerIds, result.data.id];
			newPlayerName = '';
			showAddPlayer = false;

			addToast({
				type: 'success',
				message: `Joueur ${result.data.name} ajouté avec succès`
			});
		} catch (error) {
			addToast({
				type: 'error',
				message: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du joueur'
			});
		}
	};

	const handleSubmit = async () => {
		// Réinitialiser les erreurs
		errors = { title: '', date: '', players: '' };

		// Validation côté client
		const validation = createTournamentSchema.safeParse({
			title: formData.title,
			location: formData.location || undefined,
			date: formData.date,
			playerIds: formData.selectedPlayerIds
		});

		if (!validation.success) {
			const fieldErrors = validation.error.flatten().fieldErrors;
			if (fieldErrors.title) errors.title = fieldErrors.title[0];
			if (fieldErrors.date) errors.date = fieldErrors.date[0];
			if (fieldErrors.playerIds) errors.players = fieldErrors.playerIds[0];
			return;
		}

		loading = true;

		try {
			const response = await fetch('/api/tournaments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					title: formData.title,
					location: formData.location || null,
					date: formData.date,
					playerIds: formData.selectedPlayerIds
				})
			});
		const result = await response.json();
		console.log('API Response:', result); // Debug log

		if (!result.success) {
			throw new Error(result.error?.message || 'Erreur lors de la création du tournoi');
		}

		addToast({
			type: 'success',
			message: 'Tournoi créé avec succès'
		});

		// Vérifier que result.data et result.data.id existent
		if (result.data && result.data.id) {
			console.log('Redirecting to tournament:', result.data.id); // Debug log
			goto(`/tournaments/${result.data.id}`);
		} else {
			console.log('No tournament ID, redirecting to home'); // Debug log
			// Fallback vers la page d'accueil si pas d'ID
			goto('/');
		}
		} catch (error) {
			addToast({
				type: 'error',
				message: error instanceof Error ? error.message : 'Erreur lors de la création du tournoi'
			});
		} finally {
			loading = false;
		}
	};

	const isFormValid = () => {
		return formData.title.trim() && 
		       formData.date && 
		       formData.selectedPlayerIds.length >= 4 && 
		       isPowerOfTwo(formData.selectedPlayerIds.length) &&
		       !errors.title && 
		       !errors.date && 
		       !errors.players;
	};
</script>

<div class="p-4">
	<!-- Header avec bouton retour -->
	<header class="flex items-center gap-4 mb-6">
		<button 
			onclick={() => goto('/')}
			class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
		>
			<ArrowLeft class="w-5 h-5 text-gray-600" />
		</button>
		<div>
			<h1 class="text-xl font-bold text-gray-900">Créer un tournoi</h1>
			<p class="text-sm text-gray-600">Configurez votre nouveau tournoi</p>
		</div>
	</header>

	<form class="space-y-6">
		<!-- Titre du tournoi -->
		<div>
			<label for="title" class="block text-sm font-medium text-gray-700 mb-2">
				Titre du tournoi *
			</label>
			<input
				type="text"
				id="title"
				bind:value={formData.title}
				placeholder="Ex: Tournoi d'été 2024"
				class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				class:border-red-300={errors.title}
			/>
			{#if errors.title}
				<p class="mt-1 text-sm text-red-600">{errors.title}</p>
			{/if}
		</div>

		<!-- Lieu -->
		<div>
			<label for="location" class="block text-sm font-medium text-gray-700 mb-2">
				Lieu (optionnel)
			</label>
			<div class="relative">
				<MapPin class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="text"
					id="location"
					bind:value={formData.location}
					placeholder="Ex: Salle de sport municipale"
					class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
		</div>

		<!-- Date -->
		<div>
			<label for="date" class="block text-sm font-medium text-gray-700 mb-2">
				Date du tournoi *
			</label>
			<div class="relative">
				<Calendar class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					type="date"
					id="date"
					bind:value={formData.date}
					class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					class:border-red-300={errors.date}
				/>
			</div>
			{#if errors.date}
				<p class="mt-1 text-sm text-red-600">{errors.date}</p>
			{/if}
		</div>

		<!-- Sélection des joueurs -->
		<div>
			<div class="flex items-center justify-between mb-3">
				<span class="text-sm font-medium text-gray-700">
					Participants * ({formData.selectedPlayerIds.length} sélectionnés)
				</span>
				<button
					type="button"
					onclick={() => showAddPlayer = !showAddPlayer}
					class="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
				>
					<Plus class="w-4 h-4" />
					Ajouter un joueur
				</button>
			</div>

			<!-- Formulaire ajout rapide joueur -->
			{#if showAddPlayer}
				<div class="bg-gray-50 rounded-xl p-4 mb-4">
					<div class="flex gap-2">
						<div class="relative flex-1">
							<User class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								bind:value={newPlayerName}
								placeholder="Nom du joueur"
								class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
								onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPlayer())}
							/>
						</div>
						<button
							type="button"
							onclick={handleAddPlayer}
							disabled={!newPlayerName.trim()}
							class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm font-medium"
						>
							Ajouter
						</button>
					</div>
				</div>
			{/if}

			<!-- Liste des joueurs -->
			<div class="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
				{#each players as player (player.id)}
					<button
						type="button"
						onclick={() => togglePlayerSelection(player.id)}
						class="flex items-center gap-3 p-3 rounded-xl border transition-all text-left"
						class:bg-blue-50={formData.selectedPlayerIds.includes(player.id)}
						class:border-blue-200={formData.selectedPlayerIds.includes(player.id)}
						class:text-blue-700={formData.selectedPlayerIds.includes(player.id)}
						class:bg-white={!formData.selectedPlayerIds.includes(player.id)}
						class:border-gray-200={!formData.selectedPlayerIds.includes(player.id)}
						class:hover:bg-gray-50={!formData.selectedPlayerIds.includes(player.id)}
					>
						<div 
							class="w-4 h-4 rounded border-2 flex items-center justify-center"
							class:bg-blue-600={formData.selectedPlayerIds.includes(player.id)}
							class:border-blue-600={formData.selectedPlayerIds.includes(player.id)}
							class:border-gray-300={!formData.selectedPlayerIds.includes(player.id)}
						>
							{#if formData.selectedPlayerIds.includes(player.id)}
								<div class="w-2 h-2 bg-white rounded-full"></div>
							{/if}
						</div>
						<span class="text-sm font-medium truncate">{player.name}</span>
					</button>
				{/each}
			</div>

			{#if errors.players}
				<p class="mt-2 text-sm text-red-600">{errors.players}</p>
			{/if}

			<!-- Aide sur la puissance de 2 -->
			{#if formData.selectedPlayerIds.length > 0 && !isPowerOfTwo(formData.selectedPlayerIds.length)}
				<div class="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
					<div class="flex gap-2">
						<AlertTriangle class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
						<div>
							<p class="text-sm font-medium text-amber-800">Nombre de participants invalide</p>
							<p class="text-xs text-amber-700 mt-1">
								Le nombre de participants doit être une puissance de 2 : 4, 8, 16, 32...
								<br />Actuellement : {formData.selectedPlayerIds.length} joueurs
							</p>
						</div>
					</div>
				</div>
			{:else if isPowerOfTwo(formData.selectedPlayerIds.length) && formData.selectedPlayerIds.length >= 4}
				<div class="mt-3 bg-green-50 border border-green-200 rounded-xl p-3">
					<div class="flex gap-2">
						<div class="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
							<div class="w-2 h-2 bg-white rounded-full"></div>
						</div>
						<div>
							<p class="text-sm font-medium text-green-800">Configuration valide</p>
							<p class="text-xs text-green-700 mt-1">
								{formData.selectedPlayerIds.length} participants - Tournoi prêt à être créé
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Boutons d'action -->
		<div class="flex gap-3 pt-4">
			<button
				type="button"
				onclick={() => goto('/')}
				class="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
			>
				Annuler
			</button>
			<button
				type="button"
				onclick={handleSubmit}
				disabled={!isFormValid() || loading}
				class="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Création...' : 'Créer le tournoi'}
			</button>
		</div>
	</form>
</div>
