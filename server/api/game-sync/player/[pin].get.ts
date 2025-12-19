// server/api/game-sync/player/[pin].get.ts
// Endpoint pour qu'un joueur récupère ses données via polling
import { getSession } from '~/server/utils/playerSessions'
import { getPlayerData } from '~/server/utils/gameSync'

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

  const playerData = getPlayerData(session.campaignId, session.gameId, session.playerId)

  return {
    success: true,
    session: {
      campaignId: session.campaignId,
      gameId: session.gameId,
      playerId: session.playerId,
      playerName: session.playerName
    },
    playerData: playerData || null
  }
})
