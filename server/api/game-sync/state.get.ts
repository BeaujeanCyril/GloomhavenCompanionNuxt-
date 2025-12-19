// server/api/game-sync/state.get.ts
// Endpoint pour que le Game Master récupère l'état actuel (avec les modifs des joueurs)
import { getGameState } from '~/server/utils/gameSync'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const campaignId = Number(query.campaignId)
  const scenarioId = Number(query.scenarioId)

  if (!campaignId || !scenarioId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'campaignId et scenarioId requis'
    })
  }

  const state = getGameState(campaignId, scenarioId)

  return {
    success: true,
    state: state || null
  }
})
