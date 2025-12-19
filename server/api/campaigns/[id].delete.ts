// server/api/campaigns/[id].delete.ts
import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID de campagne invalide'
    })
  }

  try {
    // Vérifier que la campagne existe
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id }
    })

    if (!existingCampaign) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Campagne non trouvée'
      })
    }

    // Supprimer la campagne
    // Grâce à onDelete: Cascade dans le schema Prisma,
    // tous les joueurs, campaignScenarios et relations seront supprimés automatiquement
    await prisma.campaign.delete({
      where: { id }
    })

    return {
      success: true,
      message: 'Campagne supprimée avec succès',
      deletedId: id
    }
  } catch (error: any) {
    console.error('Erreur lors de la suppression de la campagne:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Erreur lors de la suppression de la campagne'
    })
  }
})
