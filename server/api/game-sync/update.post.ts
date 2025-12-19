// server/api/game-sync/update.post.ts
// Endpoint pour que le Game Master mette à jour l'état du jeu
import { updateGameState } from '~/server/utils/gameSync'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
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
  }>(event)

  if (!body.campaignId || !body.scenarioId || !body.players) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données manquantes'
    })
  }

  updateGameState(body.campaignId, body.scenarioId, body.players)

  return { success: true }
})
