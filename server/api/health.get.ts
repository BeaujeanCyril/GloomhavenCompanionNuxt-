// server/api/health.get.ts
import prisma from '~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    // Test de connexion à la base
    await prisma.$connect()

    // Compter les éléments
    const elementCount = await prisma.element.count()

    // Compter les scénarios
    const scenarioCount = await prisma.scenario.count()

    // Compter les campagnes
    const campaignCount = await prisma.campaign.count()

    return {
      status: 'ok',
      database: 'connected',
      counts: {
        elements: elementCount,
        scenarios: scenarioCount,
        campaigns: campaignCount
      }
    }
  } catch (error: any) {
    return {
      status: 'error',
      database: 'disconnected',
      error: error.message
    }
  } finally {
    await prisma.$disconnect()
  }
})
