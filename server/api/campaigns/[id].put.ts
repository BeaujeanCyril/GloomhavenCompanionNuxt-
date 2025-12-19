// server/api/campaigns/[id].put.ts
import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de campagne invalide'
    })
  }

  const body = await readBody(event)

  // Valider les données
  if (!body.companyName || typeof body.companyName !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le nom de la campagne est requis'
    })
  }

  try {
    // Vérifier que la campagne existe
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: { players: true }
    })

    if (!existingCampaign) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Campagne non trouvée'
      })
    }

    // Utiliser une transaction pour garantir la cohérence
    const updatedCampaign = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour le nom de la campagne
      await tx.campaign.update({
        where: { id },
        data: {
          companyName: body.companyName
        }
      })

      // 2. Récupérer les IDs des joueurs existants
      const existingPlayerIds = existingCampaign.players.map(p => p.id)
      const receivedPlayerIds = body.players
        .filter((p: any) => p.id)
        .map((p: any) => p.id)

      // 3. Supprimer les joueurs qui ne sont plus dans la liste
      const playersToDelete = existingPlayerIds.filter(
        existingId => !receivedPlayerIds.includes(existingId)
      )

      if (playersToDelete.length > 0) {
        await tx.player.deleteMany({
          where: {
            id: { in: playersToDelete },
            campaignId: id
          }
        })
      }

      // 4. Mettre à jour ou créer chaque joueur
      for (const player of body.players) {
        if (player.id) {
          // Mise à jour d'un joueur existant
          await tx.player.update({
            where: { id: player.id },
            data: {
              name: player.name,
              healthPointsMax: player.healthPointsMax,
              coins: player.coins ?? 0,
              xp: player.xp ?? 0
            }
          })
        } else {
          // Création d'un nouveau joueur
          await tx.player.create({
            data: {
              name: player.name,
              healthPointsMax: player.healthPointsMax,
              coins: player.coins ?? 0,
              xp: player.xp ?? 0,
              campaignId: id
            }
          })
        }
      }

      // 5. Retourner la campagne mise à jour avec toutes ses relations
      return await tx.campaign.findUnique({
        where: { id },
        include: {
          players: true,
          campaignScenarios: {
            include: {
              scenario: true,
              game: {
                include: {
                  monsterDeck: {
                    include: {
                      cards: true
                    }
                  },
                  playerGames: true,
                  rounds: true
                }
              }
            }
          }
        }
      })
    })

    return updatedCampaign
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour de la campagne:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur lors de la mise à jour de la campagne'
    })
  }
})
