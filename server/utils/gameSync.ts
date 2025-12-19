// server/utils/gameSync.ts
// Store de synchronisation des données de jeu entre Game Master et joueurs

interface GameState {
  campaignId: number
  scenarioId: number
  players: Array<{
    id: number
    name: string
    healthPoints: number
    healthPointsMax: number
    scenarioXp: number
    coins: number
  }>
  lastUpdate: Date
}

// Map: "campaignId-scenarioId" -> GameState
const gameStates = new Map<string, GameState>()

// Créer la clé du jeu
function getGameKey(campaignId: number, scenarioId: number): string {
  return `${campaignId}-${scenarioId}`
}

// Mettre à jour l'état du jeu (depuis le GM)
export function updateGameState(campaignId: number, scenarioId: number, players: GameState['players']): void {
  const key = getGameKey(campaignId, scenarioId)
  gameStates.set(key, {
    campaignId,
    scenarioId,
    players,
    lastUpdate: new Date()
  })
}

// Récupérer l'état du jeu
export function getGameState(campaignId: number, scenarioId: number): GameState | undefined {
  const key = getGameKey(campaignId, scenarioId)
  return gameStates.get(key)
}

// Mettre à jour les stats d'un joueur (depuis le joueur mobile)
export function updatePlayerStats(
  campaignId: number,
  scenarioId: number,
  playerId: number,
  stats: { healthPoints?: number, scenarioXp?: number, coins?: number }
): boolean {
  const key = getGameKey(campaignId, scenarioId)
  const state = gameStates.get(key)

  if (!state) return false

  const player = state.players.find(p => p.id === playerId)
  if (!player) return false

  if (stats.healthPoints !== undefined) player.healthPoints = stats.healthPoints
  if (stats.scenarioXp !== undefined) player.scenarioXp = stats.scenarioXp
  if (stats.coins !== undefined) player.coins = stats.coins

  state.lastUpdate = new Date()
  return true
}

// Récupérer les données d'un joueur spécifique
export function getPlayerData(campaignId: number, scenarioId: number, playerId: number): GameState['players'][0] | undefined {
  const state = getGameState(campaignId, scenarioId)
  return state?.players.find(p => p.id === playerId)
}

// Nettoyer les anciens états de jeu (plus de 24h)
export function cleanOldGameStates(): void {
  const now = new Date()
  const maxAge = 24 * 60 * 60 * 1000 // 24 heures

  for (const [key, state] of gameStates.entries()) {
    if (now.getTime() - state.lastUpdate.getTime() > maxAge) {
      gameStates.delete(key)
    }
  }
}
