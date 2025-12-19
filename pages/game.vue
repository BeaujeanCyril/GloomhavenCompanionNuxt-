<!-- pages/game.vue -->
<script setup lang="ts">
const appStore = useAppStore()

// États locaux
const showPopup = ref(false)
const showTimerPopup = ref(false)
const showPinsModal = ref(false)
const { isFullscreen, toggleFullscreen, handleFullscreenChange } = useFullscreen()
const { isDarkMode, toggleTheme } = useTheme()
const { showToast } = useToast()
const {
  syncGameState,
  startGMPolling,
  stopPolling,
  isConnected: isSyncConnected
} = useGameSync()

let roundTimer: NodeJS.Timeout | null = null

// PINs des joueurs
const playerPins = ref<Array<{ id: number, name: string, pin?: string, isConnected?: boolean }>>([])

// URL de base pour les QR codes
const baseUrl = computed(() => {
  if (process.client) {
    return window.location.origin
  }
  return ''
})

// Initialiser le timer et la synchronisation au montage
onMounted(async () => {
  startRoundTimer()

  // Écouter les changements de fullscreen
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // Initialiser les PINs depuis les joueurs
  if (appStore.currentGame?.players) {
    playerPins.value = appStore.currentGame.players.map(p => ({
      id: p.id!,
      name: p.name
    }))
  }

  // Synchroniser l'état du jeu et démarrer le polling
  if (appStore.currentCampaign && appStore.currentScenario && appStore.currentGame) {
    // Envoyer l'état initial au serveur
    await syncGameState(
        appStore.currentCampaign.id!,
        appStore.currentScenario.id,
        appStore.currentGame.players
    )

    // Démarrer le polling pour recevoir les mises à jour des joueurs
    startGMPolling(
        appStore.currentCampaign.id!,
        appStore.currentScenario.id,
        (updatedPlayers) => {
          if (appStore.currentGame?.players) {
            // Mettre à jour les joueurs locaux avec les données du serveur
            for (const serverPlayer of updatedPlayers) {
              const localPlayer = appStore.currentGame.players.find((p: { id?: number }) => p.id === serverPlayer.id)
              if (localPlayer) {
                // Vérifier si les stats ont changé
                if (localPlayer.healthPoints !== serverPlayer.healthPoints ||
                    localPlayer.scenarioXp !== serverPlayer.scenarioXp ||
                    localPlayer.coins !== serverPlayer.coins) {
                  localPlayer.healthPoints = serverPlayer.healthPoints
                  localPlayer.scenarioXp = serverPlayer.scenarioXp
                  localPlayer.coins = serverPlayer.coins
                  console.log(`📊 Stats mises à jour pour ${serverPlayer.name}`)
                }
              }
            }
          }
        },
        3000 // Poll toutes les 3 secondes
    )
  }

  // Debug : Afficher l'état du store
  console.log('=== DEBUG GAME.VUE ===')
  console.log('currentCampaign:', appStore.currentCampaign)
  console.log('currentScenario:', appStore.currentScenario)
  console.log('currentGame:', appStore.currentGame)
  if (appStore.currentGame) {
    console.log('currentGame.players:', appStore.currentGame.players)
    console.log('currentGame.monsterDeck:', appStore.currentGame.monsterDeck)
    console.log('currentGame.rounds:', appStore.currentGame.rounds)
  }
  console.log('elements:', appStore.elements)
  console.log('=====================')
})

// Nettoyer le timer et le polling au démontage
onUnmounted(() => {
  if (roundTimer) {
    clearTimeout(roundTimer)
  }
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  stopPolling()
})

// Timer de 5 minutes
const startRoundTimer = () => {
  if (roundTimer) {
    clearTimeout(roundTimer)
  }

  roundTimer = setTimeout(() => {
    showTimerPopup.value = true
  }, 300000) // 5 minutes = 300000ms
}

const togglePopup = () => {
  showPopup.value = !showPopup.value
}

const nextRound = () => {
  appStore.nextRound()
  reduceAllElements()

  // Redémarrer le timer
  showTimerPopup.value = false
  startRoundTimer()
}

const resetScenario = async () => {
  await appStore.resetScenario()
}

const saveCampaign = async () => {
  try {
    await appStore.saveCampaign()
    showToast('Campagne sauvegardée avec succès', 'success')
  } catch (error) {
    showToast('Erreur lors de la sauvegarde', 'error')
  }
}

const closeTimerPopup = () => {
  showTimerPopup.value = false
}

const setElementStrong = (id: number) => {
  const element = appStore.elements.find((e: { id: number, state: number }) => e.id === id)
  if (element && (element.state === 0 || element.state === 1)) {
    element.state = 2 // Fort
  }
}

const useState = (id: number) => {
  const element = appStore.elements.find((e: { id: number, state: number }) => e.id === id)
  if (element) {
    element.state = element.state === 2 ? 0 : (element.state === 1 ? 0 : element.state)
  }
}

const reduceAllElements = () => {
  appStore.elements.forEach((element: { state: number }) => {
    element.state = element.state === 2 ? 1 : (element.state === 1 ? 0 : element.state)
  })
}

// Computed pour le round actuel
const currentRound = computed(() => {
  if (!appStore.currentGame) return null
  const { currentRound } = useGame()
  return currentRound(appStore.currentGame)
})

// Générer les PINs pour les joueurs
const generatePins = async () => {
  if (!appStore.currentCampaign || !appStore.currentScenario || !appStore.currentGame) return

  try {
    const response = await $fetch('/api/player-sessions/generate', {
      method: 'POST',
      body: {
        campaignId: appStore.currentCampaign.id,
        scenarioId: appStore.currentScenario.id,
        gameId: appStore.currentScenario.id,
        players: appStore.currentGame.players.map((p: { id?: number, name: string }) => ({ id: p.id, name: p.name }))
      }
    }) as { success: boolean, pins: Array<{ playerId: number, playerName: string, pin: string }> }

    if (response.success) {
      // Mettre à jour les PINs
      playerPins.value = response.pins.map(p => ({
        id: p.playerId,
        name: p.playerName,
        pin: p.pin,
        isConnected: false
      }))
      showToast('Codes PIN générés avec succès', 'success')
    }
  } catch (error) {
    console.error('Erreur génération PINs:', error)
    showToast('Erreur lors de la génération des PINs', 'error')
  }
}

// Synchroniser les modifications du GM vers le serveur
watch(() => appStore.currentGame?.players, async (newPlayers: typeof appStore.currentGame.players | undefined) => {
  if (newPlayers && appStore.currentCampaign && appStore.currentScenario) {
    await syncGameState(
        appStore.currentCampaign.id!,
        appStore.currentScenario.id,
        newPlayers
    )
  }
}, { deep: true })
</script>

<template>
  <div
      class="min-h-screen p-4 transition-colors duration-300 flex flex-col gap-4"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">

    <!-- Barre de contrôle en haut (pleine largeur) -->
    <div class="flex gap-4">
      <!-- Scénario + Round + Boutons -->
      <div
          class="flex-1 backdrop-blur-sm rounded-xl p-3 shadow-2xl transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
            : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
        <div class="flex items-center gap-3">
          <!-- Miniature scénario -->
          <button
              @click="togglePopup"
              class="relative rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl flex-shrink-0">
            <img
                :src="appStore.currentScenario?.imagePath"
                alt="Scénario"
                class="w-24 h-auto rounded-lg" />
          </button>

          <!-- Round -->
          <div class="flex-1">
            <RoundComponent
                v-if="currentRound"
                :round="currentRound"
                @next-round="nextRound"
            />
          </div>

          <!-- Bouton Sauvegarder -->
          <button
              @click="saveCampaign"
              class="flex items-center justify-center bg-gradient-to-r from-green-600 to-green-700 text-white w-10 h-10 rounded-lg font-semibold shadow-lg hover:from-green-700 hover:to-green-800 transition-all hover:-translate-y-0.5 flex-shrink-0"
              title="Sauvegarder la campagne">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>

          <!-- Bouton Dark/Light Mode -->
          <button
              @click="toggleTheme"
              class="flex items-center justify-center bg-gradient-to-r from-amber-500 to-orange-600 text-white w-10 h-10 rounded-lg font-semibold shadow-lg hover:from-amber-600 hover:to-orange-700 transition-all hover:-translate-y-0.5 flex-shrink-0"
              :title="isDarkMode ? 'Mode clair' : 'Mode sombre'">
            <svg v-if="isDarkMode" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Bouton Fullscreen -->
          <button
              @click="toggleFullscreen"
              class="flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700 text-white w-10 h-10 rounded-lg font-semibold shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all hover:-translate-y-0.5 flex-shrink-0"
              :title="isFullscreen ? 'Quitter plein écran (ESC)' : 'Plein écran (F11)'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <!-- Bouton Connexion Joueurs -->
          <button
              @click="showPinsModal = true"
              class="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white w-10 h-10 rounded-lg font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all hover:-translate-y-0.5 flex-shrink-0"
              title="Connexion des joueurs (QR codes)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>

          <!-- Bouton Reset -->
          <button
              @click="resetScenario"
              class="flex items-center justify-center bg-gradient-to-r from-red-600 to-red-700 text-white w-10 h-10 rounded-lg font-semibold shadow-lg hover:from-red-700 hover:to-red-800 transition-all hover:-translate-y-0.5 flex-shrink-0"
              title="Reset scenario">
            <span class="text-2xl transition-transform hover:rotate-180">↻</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Layout principal en 2 colonnes -->
    <div class="flex gap-4 flex-1">

      <!-- COLONNE GAUCHE : Éléments + Deck monstre -->
      <div class="w-[30%] flex flex-col gap-3">

        <!-- Éléments en 2x3 -->
        <div
            class="backdrop-blur-sm rounded-xl p-3 shadow-2xl transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
          <ElementComponent
              @use-element="useState"
              @set-element-strong="setElementStrong"
          />
        </div>

        <!-- Deck de monstres compact -->
        <div
            class="flex-1 backdrop-blur-sm rounded-xl p-3 shadow-2xl overflow-auto transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
              : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
          <DeckComponent
              v-if="appStore.currentGame?.monsterDeck"
              :deck-name="appStore.currentGame.monsterDeck.name"
          />
        </div>

      </div>

      <!-- COLONNE DROITE (70%) : Joueurs en 2x2 optimisé -->
      <div
          class="w-[70%] backdrop-blur-sm rounded-xl p-2 shadow-2xl transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-r from-slate-700/90 to-slate-600/80 border border-white/10'
            : 'bg-gradient-to-r from-white/90 to-blue-100/80 border border-gray-200'">
        <div
            v-if="appStore.currentGame && appStore.currentGame.players && appStore.currentGame.players.length > 0"
            class="grid grid-cols-2 grid-rows-2 gap-2 h-full w-full">
          <div
              v-for="player in appStore.currentGame.players"
              :key="player.id"
              class="transition-transform hover:scale-[1.02] flex items-center justify-center w-full h-full">
            <PlayerComponent :player="player" />
          </div>
        </div>
      </div>

    </div>

    <!-- Popup Timer -->
    <Transition name="fade">
      <div
          v-if="showTimerPopup"
          class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
        <div
            class="p-8 rounded-2xl max-w-md w-11/12 shadow-2xl text-center animate-pulse transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
              : 'bg-gradient-to-br from-white to-blue-50 border border-gray-200'">
          <div class="text-6xl mb-4">⏰</div>
          <h3
              class="text-2xl font-bold mb-2"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            Temps écoulé
          </h3>
          <p
              class="mb-6"
              :class="isDarkMode ? 'text-white/80' : 'text-gray-600'">
            Le délai de 5 minutes pour ce round est terminé.
          </p>
          <button
              @click="closeTimerPopup"
              class="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-orange-600 hover:to-amber-700 transition-all hover:-translate-y-0.5">
            Fermer
          </button>
        </div>
      </div>
    </Transition>

    <!-- Popup Rounds -->
    <Transition name="fade">
      <div
          v-if="showPopup"
          class="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
        <div
            class="p-6 rounded-2xl max-w-lg w-11/12 shadow-2xl transition-colors duration-300"
            :class="isDarkMode
              ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
              : 'bg-gradient-to-br from-white to-blue-50 border border-gray-200'">
          <div class="flex justify-between items-center mb-6">
            <h3
                class="text-2xl font-bold"
                :class="isDarkMode ? 'text-white' : 'text-gray-800'">
              Historique des rounds
            </h3>
            <button
                @click="togglePopup"
                class="text-3xl w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                :class="isDarkMode
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-800 hover:bg-gray-200'">
              ×
            </button>
          </div>
          <div class="flex flex-col gap-3 max-h-96 overflow-y-auto">
            <div
                v-for="round in appStore.currentGame?.rounds"
                :key="round.roundNumber"
                class="flex justify-between items-center p-4 rounded-lg hover:translate-x-1 transition-all"
                :class="isDarkMode
                  ? 'bg-slate-800/60 border border-white/10 hover:bg-slate-700/80'
                  : 'bg-blue-50 border border-gray-200 hover:bg-blue-100'">
              <span
                  class="font-semibold"
                  :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                Round {{ round.roundNumber }}
              </span>
              <span
                  class="font-mono text-sm"
                  :class="isDarkMode ? 'text-white/60' : 'text-gray-500'">
                {{ new Date(round.dateTime).toLocaleTimeString('fr-FR') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Connexion Joueurs -->
    <PlayerPinsModal
        :show="showPinsModal"
        :players="playerPins"
        :base-url="baseUrl"
        @close="showPinsModal = false"
        @generate-pins="generatePins"
    />

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
