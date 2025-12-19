<!-- pages/player/[pin].vue -->
<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const pin = route.params.pin as string

const { isDarkMode, initTheme } = useTheme()
const {
  fetchPlayerData,
  updatePlayerStats,
  startPlayerPolling,
  stopPolling,
  isConnected
} = useGameSync()

const isLoading = ref(true)
const error = ref<string | null>(null)
const playerName = ref('')
const playerId = ref<number | null>(null)
const playerData = ref<{
  id: number
  name: string
  healthPoints: number
  healthPointsMax: number
  scenarioXp: number
  coins: number
} | null>(null)
const lastSyncTime = ref<Date | null>(null)

// Charger les données initiales et démarrer le polling
onMounted(async () => {
  initTheme()

  try {
    // Vérifier le PIN et récupérer les données initiales
    const response = await fetchPlayerData(pin)

    if (!response) {
      throw new Error('Session invalide ou PIN expiré')
    }

    playerName.value = response.session.playerName
    playerId.value = response.session.playerId

    if (response.playerData) {
      playerData.value = response.playerData
      lastSyncTime.value = new Date()
    }

    // Démarrer le polling pour recevoir les mises à jour du GM
    startPlayerPolling(
        pin,
        (updatedData) => {
          // Vérifier si les données ont changé (mises à jour du GM)
          if (playerData.value) {
            const currentData = playerData.value
            // Ne mettre à jour que si c'est une mise à jour du GM (pas nos propres modifications)
            if (updatedData.healthPointsMax !== currentData.healthPointsMax) {
              playerData.value = updatedData
              lastSyncTime.value = new Date()
            }
          } else {
            playerData.value = updatedData
            lastSyncTime.value = new Date()
          }
        },
        3000 // Poll toutes les 3 secondes
    )

  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, message?: string }
    error.value = err.data?.statusMessage || err.message || 'Erreur de connexion'
    console.error('Erreur:', e)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopPolling()
})

// Fonctions de modification des stats
const increaseHP = async () => {
  if (!playerData.value) return
  if (playerData.value.healthPoints < playerData.value.healthPointsMax) {
    playerData.value.healthPoints++
    await syncStats()
  }
}

const decreaseHP = async () => {
  if (!playerData.value) return
  if (playerData.value.healthPoints > 0) {
    playerData.value.healthPoints--
    await syncStats()
  }
}

const increaseXP = async () => {
  if (!playerData.value) return
  playerData.value.scenarioXp++
  await syncStats()
}

const decreaseXP = async () => {
  if (!playerData.value) return
  if (playerData.value.scenarioXp > 0) {
    playerData.value.scenarioXp--
    await syncStats()
  }
}

const increaseCoin = async () => {
  if (!playerData.value) return
  playerData.value.coins++
  await syncStats()
}

const decreaseCoin = async () => {
  if (!playerData.value) return
  if (playerData.value.coins > 0) {
    playerData.value.coins--
    await syncStats()
  }
}

// Synchroniser les stats avec le serveur
const syncStats = async () => {
  if (!playerData.value) return

  const result = await updatePlayerStats(pin, {
    healthPoints: playerData.value.healthPoints,
    scenarioXp: playerData.value.scenarioXp,
    coins: playerData.value.coins
  })

  if (result) {
    lastSyncTime.value = new Date()
  }
}

// Retour à la page de connexion
const goBack = () => {
  router.push('/player')
}
</script>

<template>
  <div
      class="min-h-screen p-4 transition-colors duration-300"
      :class="isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'">

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="animate-spin h-12 w-12 mx-auto mb-4" :class="isDarkMode ? 'text-amber-500' : 'text-indigo-600'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">Connexion à la partie...</p>
      </div>
    </div>

    <!-- Erreur -->
    <div v-else-if="error" class="flex items-center justify-center min-h-screen">
      <div
          class="text-center p-8 rounded-2xl max-w-md"
          :class="isDarkMode
            ? 'bg-slate-800 border border-red-500/30'
            : 'bg-white border border-red-200'">
        <svg class="h-16 w-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 class="text-xl font-bold mb-2" :class="isDarkMode ? 'text-white' : 'text-gray-800'">
          Erreur de connexion
        </h2>
        <p class="mb-6" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
          {{ error }}
        </p>
        <button
            @click="goBack"
            class="px-6 py-3 rounded-xl font-semibold transition-all"
            :class="isDarkMode
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'">
          Réessayer
        </button>
      </div>
    </div>

    <!-- Interface joueur -->
    <div v-else-if="playerData" class="max-w-lg mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <button
            @click="goBack"
            class="p-2 rounded-lg transition-colors"
            :class="isDarkMode
              ? 'text-gray-400 hover:bg-white/10'
              : 'text-gray-600 hover:bg-gray-200'">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex items-center gap-2">
          <div
              class="w-3 h-3 rounded-full"
              :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'">
          </div>
          <span class="text-sm" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
            {{ isConnected ? 'Connecté' : 'Déconnecté' }}
          </span>
        </div>
      </div>

      <!-- Carte joueur -->
      <div
          class="rounded-3xl p-6 shadow-2xl transition-colors duration-300"
          :class="isDarkMode
            ? 'bg-gradient-to-br from-slate-800 to-slate-700 border border-white/10'
            : 'bg-white border border-gray-200'">

        <!-- Nom du joueur -->
        <div class="text-center mb-8">
          <h1
              class="text-3xl font-bold"
              :class="isDarkMode ? 'text-white' : 'text-gray-800'">
            {{ playerData.name }}
          </h1>
          <p class="text-sm mt-1" :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'">
            PIN: {{ pin }}
          </p>
        </div>

        <!-- Stats -->
        <div class="space-y-6">
          <!-- Points de vie -->
          <div
              class="rounded-2xl p-4"
              :class="isDarkMode ? 'bg-red-900/30' : 'bg-red-50'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium" :class="isDarkMode ? 'text-red-300' : 'text-red-700'">
                    Points de vie
                  </p>
                  <p class="text-xs" :class="isDarkMode ? 'text-red-400' : 'text-red-500'">
                    Max: {{ playerData.healthPointsMax }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                    @click="decreaseHP"
                    class="w-12 h-12 rounded-full text-2xl font-bold transition-all active:scale-95"
                    :class="isDarkMode
                      ? 'bg-red-800 hover:bg-red-700 text-white'
                      : 'bg-red-200 hover:bg-red-300 text-red-800'">
                  -
                </button>
                <span
                    class="text-4xl font-bold w-16 text-center"
                    :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                  {{ playerData.healthPoints }}
                </span>
                <button
                    @click="increaseHP"
                    class="w-12 h-12 rounded-full text-2xl font-bold transition-all active:scale-95"
                    :class="isDarkMode
                      ? 'bg-red-800 hover:bg-red-700 text-white'
                      : 'bg-red-200 hover:bg-red-300 text-red-800'">
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- XP -->
          <div
              class="rounded-2xl p-4"
              :class="isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium" :class="isDarkMode ? 'text-blue-300' : 'text-blue-700'">
                    XP (scénario)
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                    @click="decreaseXP"
                    class="w-12 h-12 rounded-full text-2xl font-bold transition-all active:scale-95"
                    :class="isDarkMode
                      ? 'bg-blue-800 hover:bg-blue-700 text-white'
                      : 'bg-blue-200 hover:bg-blue-300 text-blue-800'">
                  -
                </button>
                <span
                    class="text-4xl font-bold w-16 text-center"
                    :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                  {{ playerData.scenarioXp }}
                </span>
                <button
                    @click="increaseXP"
                    class="w-12 h-12 rounded-full text-2xl font-bold transition-all active:scale-95"
                    :class="isDarkMode
                      ? 'bg-blue-800 hover:bg-blue-700 text-white'
                      : 'bg-blue-200 hover:bg-blue-300 text-blue-800'">
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- Pièces -->
          <div
              class="rounded-2xl p-4"
              :class="isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center">
                  <img src="/img/General/gh-coin-1.png" alt="Coin" class="w-8 h-8" />
                </div>
                <div>
                  <p class="text-sm font-medium" :class="isDarkMode ? 'text-amber-300' : 'text-amber-700'">
                    Pièces d'or
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <button
                    @click="decreaseCoin"
                    class="w-12 h-12 rounded-full text-2xl font-bold transition-all active:scale-95"
                    :class="isDarkMode
                      ? 'bg-amber-800 hover:bg-amber-700 text-white'
                      : 'bg-amber-200 hover:bg-amber-300 text-amber-800'">
                  -
                </button>
                <span
                    class="text-4xl font-bold w-16 text-center"
                    :class="isDarkMode ? 'text-white' : 'text-gray-800'">
                  {{ playerData.coins }}
                </span>
                <button
                    @click="increaseCoin"
                    class="w-12 h-12 rounded-full text-2xl font-bold transition-all active:scale-95"
                    :class="isDarkMode
                      ? 'bg-amber-800 hover:bg-amber-700 text-white'
                      : 'bg-amber-200 hover:bg-amber-300 text-amber-800'">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dernière sync -->
        <div v-if="lastSyncTime" class="mt-6 text-center">
          <p class="text-xs" :class="isDarkMode ? 'text-gray-500' : 'text-gray-400'">
            Dernière synchronisation: {{ lastSyncTime.toLocaleTimeString() }}
          </p>
        </div>
      </div>

      <!-- Note -->
      <div class="mt-6 text-center">
        <p class="text-sm" :class="isDarkMode ? 'text-gray-500' : 'text-gray-400'">
          Les modifications sont synchronisées automatiquement avec le Game Master
        </p>
      </div>
    </div>

    <!-- Pas de données joueur -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <p :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
          En attente des données du jeu...
        </p>
        <p class="text-sm mt-2" :class="isDarkMode ? 'text-gray-500' : 'text-gray-500'">
          Le Game Master doit lancer le scénario
        </p>
      </div>
    </div>
  </div>
</template>
