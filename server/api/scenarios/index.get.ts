// server/api/scenarios/index.get.ts
import prisma from '~/server/utils/db'
import { ensureScenariosExist } from '~/server/utils/initScenarios'

export default defineEventHandler(async () => {
    // Vérifier et initialiser les scénarios si la table est vide
    await ensureScenariosExist()

    // Récupérer tous les scénarios depuis la base de données
    const scenarios = await prisma.scenario.findMany({
        orderBy: {
            id: 'asc'
        }
    })

    return scenarios
})