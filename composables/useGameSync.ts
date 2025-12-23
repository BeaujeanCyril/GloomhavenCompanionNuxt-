// composables/useGameSync.ts
// Composable pour la synchronisation des données de jeu via HTTP polling

interface Effect {
  id?: number
  name: string
}

export const useGameSync = () => {
  const isConnected = ref(false)
  const lastSync = ref<Date | null>(null)
  let pollInterval: NodeJS.Timeout | null = null

  // Game Master: Envoyer l'état du jeu au serveur
  const syncGameState = async (campaignId: number, scenarioId: number, players: Array<{
    id?: number
    name: string
    healthPoints: number
    healthPointsMax: number
    scenarioXp: number
    coins: number
    effects?: Effect[]
  }>) => {
    try {
      await $fetch('/api/game-sync/update', {
        method: 'POST',
        body: {
          campaignId,
          scenarioId,
          players: players.map(p => ({
            id: p.id,
            name: p.name,
            healthPoints: p.healthPoints,
            healthPointsMax: p.healthPointsMax,
            scenarioXp: p.scenarioXp,
            coins: p.coins,
            effects: p.effects || []
          }))
        }
      })
      lastSync.value = new Date()
      isConnected.value = true
    } catch (error) {
      console.error('Erreur sync game state:', error)
      isConnected.value = false
    }
  }

  // Game Master: Récupérer l'état du jeu (avec les modifs des joueurs)
  const fetchGameState = async (campaignId: number, scenarioId: number) => {
    try {
      const response = await $fetch<{
        success: boolean
        state: {
          players: Array<{
            id: number
            name: string
            healthPoints: number
            healthPointsMax: number
            scenarioXp: number
            coins: number
            effects?: Effect[]
          }>
          lastUpdate: string
        } | null
      }>('/api/game-sync/state', {
        query: { campaignId, scenarioId }
      })
      return response.state
    } catch (error) {
      console.error('Erreur fetch game state:', error)
      return null
    }
  }

  // Game Master: Démarrer le polling pour les mises à jour des joueurs
  const startGMPolling = (
    campaignId: number,
    scenarioId: number,
    onUpdate: (players: Array<{
      id: number
      name: string
      healthPoints: number
      healthPointsMax: number
      scenarioXp: number
      coins: number
      effects?: Effect[]
    }>) => void,
    intervalMs: number = 2000
  ) => {
    stopPolling()

    pollInterval = setInterval(async () => {
      const state = await fetchGameState(campaignId, scenarioId)
      if (state && state.players) {
        onUpdate(state.players)
        lastSync.value = new Date(state.lastUpdate)
      }
    }, intervalMs)

    isConnected.value = true
  }

  // Joueur: Récupérer ses données
  const fetchPlayerData = async (pin: string) => {
    try {
      const response = await $fetch<{
        success: boolean
        session: {
          campaignId: number
          gameId: number
          playerId: number
          playerName: string
        }
        playerData: {
          id: number
          name: string
          healthPoints: number
          healthPointsMax: number
          scenarioXp: number
          coins: number
          effects?: Effect[]
        } | null
      }>(`/api/game-sync/player/${pin}`)

      lastSync.value = new Date()
      isConnected.value = true
      return response
    } catch (error) {
      console.error('Erreur fetch player data:', error)
      isConnected.value = false
      return null
    }
  }

  // Joueur: Mettre à jour ses stats
  const updatePlayerStats = async (pin: string, stats: {
    healthPoints?: number
    scenarioXp?: number
    coins?: number
    effects?: Effect[]
  }) => {
    try {
      const response = await $fetch<{
        success: boolean
        playerData: {
          id: number
          name: string
          healthPoints: number
          healthPointsMax: number
          scenarioXp: number
          coins: number
          effects?: Effect[]
        }
      }>(`/api/game-sync/player/${pin}`, {
        method: 'POST',
        body: stats
      })

      lastSync.value = new Date()
      return response.playerData
    } catch (error) {
      console.error('Erreur update player stats:', error)
      return null
    }
  }

  // Joueur: Démarrer le polling pour les mises à jour du GM
  const startPlayerPolling = (
    pin: string,
    onUpdate: (playerData: {
      id: number
      name: string
      healthPoints: number
      healthPointsMax: number
      scenarioXp: number
      coins: number
      effects?: Effect[]
    }) => void,
    intervalMs: number = 2000
  ) => {
    stopPolling()

    pollInterval = setInterval(async () => {
      const response = await fetchPlayerData(pin)
      if (response && response.playerData) {
        onUpdate(response.playerData)
      }
    }, intervalMs)

    isConnected.value = true
  }

  // Arrêter le polling
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    isConnected.value = false
  }

  return {
    isConnected,
    lastSync,
    syncGameState,
    fetchGameState,
    fetchPlayerData,
    updatePlayerStats,
    startGMPolling,
    startPlayerPolling,
    stopPolling
  }
}
