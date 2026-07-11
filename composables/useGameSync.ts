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

  // WebSocket : connecte /_ws/game/<campaignId>/<scenarioId> et déclenche
  // onTrigger à chaque event reçu. Le polling reste actif en parallèle (failsafe).
  // Retourne une fonction stop.
  const startGameWebSocket = (
    campaignId: number,
    scenarioId: number,
    onTrigger: () => void
  ): (() => void) => {
    if (typeof window === 'undefined') return () => {}
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${window.location.host}/_ws/game/${campaignId}/${scenarioId}`
    let socket: WebSocket | null = null
    let stopped = false
    let reconnectAttempts = 0
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pingTimer: ReturnType<typeof setInterval> | null = null

    const cleanup = () => {
      if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }

    const scheduleReconnect = () => {
      if (stopped || reconnectTimer) return
      const delay = Math.min(30_000, 500 * 2 ** Math.min(reconnectAttempts, 6))
      reconnectAttempts++
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (stopped) return
      try {
        socket = new WebSocket(url)
      } catch {
        scheduleReconnect()
        return
      }
      socket.onopen = () => {
        reconnectAttempts = 0
        if (pingTimer) clearInterval(pingTimer)
        pingTimer = setInterval(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            try { socket.send('ping') } catch {}
          }
        }, 30_000)
      }
      socket.onmessage = (ev) => {
        try {
          const evt = JSON.parse(ev.data) as { type?: string }
          if (evt.type === 'hello' || evt.type === 'pong' || evt.type === 'error') return
          onTrigger()
        } catch {
          // ignore
        }
      }
      socket.onclose = () => {
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
        socket = null
        scheduleReconnect()
      }
      socket.onerror = () => {
        // onclose suivra
      }
    }

    connect()

    return () => {
      stopped = true
      cleanup()
      if (socket) {
        try { socket.close() } catch {}
        socket = null
      }
    }
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
    stopPolling,
    startGameWebSocket
  }
}
