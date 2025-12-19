// server/api/game-sync/player/[pin].post.ts
// Endpoint pour qu'un joueur mette à jour ses stats
import { getSession } from '~/server/utils/playerSessions'
import { updatePlayerStats, getPlayerData } from '~/server/utils/gameSync'

export default defineEventHandler(async (event) => {
  const pin = event.context.params?.pin

  if (!pin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PIN manquant'
    })
  }

  const session = getSession(pin)

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session non trouvée ou PIN expiré'
    })
  }

  const body = await readBody<{
    healthPoints?: number
    scenarioXp?: number
    coins?: number
  }>(event)

  const success = updatePlayerStats(
    session.campaignId,
    session.gameId,
    session.playerId,
    body
  )

  if (!success) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Jeu non trouvé ou joueur non dans la partie'
    })
  }

  // Retourner les données mises à jour
  const playerData = getPlayerData(session.campaignId, session.gameId, session.playerId)

  return {
    success: true,
    playerData
  }
})
