// server/api/player-sessions/generate.post.ts
import {
  generateUniquePin,
  createSession,
  clearSessionsForGame
} from '~/server/utils/playerSessions'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    campaignId: number
    scenarioId: number
    gameId: number
    players: Array<{ id: number, name: string }>
  }>(event)

  if (!body.campaignId || !body.players || body.players.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données manquantes: campaignId et players requis'
    })
  }

  const generatedPins: Array<{ playerId: number, playerName: string, pin: string }> = []

  // Nettoyer les anciens PINs pour cette campagne/scénario
  clearSessionsForGame(body.campaignId, body.scenarioId)

  // Générer un PIN unique pour chaque joueur
  for (const player of body.players) {
    const pin = generateUniquePin()

    createSession(pin, {
      gameId: body.scenarioId,
      campaignId: body.campaignId,
      playerId: player.id,
      playerName: player.name,
      createdAt: new Date()
    })

    generatedPins.push({
      playerId: player.id,
      playerName: player.name,
      pin
    })
  }

  console.log(`🔑 PINs générés pour la campagne ${body.campaignId}:`, generatedPins.map(p => `${p.playerName}: ${p.pin}`))

  return {
    success: true,
    pins: generatedPins
  }
})
