// server/api/elements/index.get.ts
import prisma from '~/server/utils/db'
import { ensureElementsExist } from '~/server/utils/initElements'

export default defineEventHandler(async () => {
    // Vérifier et initialiser les éléments si la table est vide
    await ensureElementsExist()

    // Récupérer tous les éléments depuis la base de données
    const elements = await prisma.element.findMany({
        orderBy: {
            id: 'asc'
        }
    })

    return elements
})
