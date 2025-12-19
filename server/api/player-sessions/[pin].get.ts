// server/api/player-sessions/[pin].get.ts
import { getSession } from '~/server/utils/playerSessions'

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

  return {
    success: true,
    session: {
      campaignId: session.campaignId,
      gameId: session.gameId,
      playerId: session.playerId,
      playerName: session.playerName
    }
  }
})
