// server/utils/playerSessions.ts

// Store des sessions actives: PIN -> { gameId, campaignId, playerId, playerName }
export interface PlayerSession {
  gameId: number
  campaignId: number
  playerId: number
  playerName: string
  createdAt: Date
}

// Utiliser une Map globale pour stocker les sessions
const activeSessions = new Map<string, PlayerSession>()

// Générer un PIN aléatoire de 4 chiffres
function generatePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Générer un PIN unique (non utilisé)
export function generateUniquePin(): string {
  let pin: string
  let attempts = 0
  const maxAttempts = 100

  do {
    pin = generatePin()
    attempts++
    if (attempts >= maxAttempts) {
      throw new Error('Impossible de générer un PIN unique')
    }
  } while (activeSessions.has(pin))

  return pin
}

// Créer une session
export function createSession(pin: string, session: PlayerSession): void {
  activeSessions.set(pin, session)
}

// Récupérer une session
export function getSession(pin: string): PlayerSession | undefined {
  return activeSessions.get(pin)
}

// Supprimer une session
export function deleteSession(pin: string): boolean {
  return activeSessions.delete(pin)
}

// Supprimer toutes les sessions d'une campagne/scénario
export function clearSessionsForGame(campaignId: number, gameId: number): void {
  for (const [pin, session] of activeSessions.entries()) {
    if (session.campaignId === campaignId && session.gameId === gameId) {
      activeSessions.delete(pin)
    }
  }
}

// Nettoyer les sessions expirées (plus de 24h)
export function cleanExpiredSessions(): void {
  const now = new Date()
  const maxAge = 24 * 60 * 60 * 1000 // 24 heures

  for (const [pin, session] of activeSessions.entries()) {
    if (now.getTime() - session.createdAt.getTime() > maxAge) {
      activeSessions.delete(pin)
    }
  }
}

// Exporter pour debug
export function getAllSessions(): Map<string, PlayerSession> {
  return activeSessions
}
