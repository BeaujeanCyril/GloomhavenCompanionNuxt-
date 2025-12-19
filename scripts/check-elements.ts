// scripts/check-elements.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkElements() {
  try {
    console.log('🔍 Vérification des éléments en base de données...\n')

    const count = await prisma.element.count()
    console.log(`📊 Nombre d'éléments en base: ${count}`)

    if (count > 0) {
      const elements = await prisma.element.findMany({
        orderBy: { id: 'asc' }
      })

      console.log('\n📋 Liste des éléments:')
      elements.forEach(el => {
        console.log(`  - ID ${el.id}: ${el.name} (${el.imagePath})`)
      })
    } else {
      console.log('\n⚠️  Aucun élément trouvé en base de données')
      console.log('💡 Suggestion: L\'auto-initialisation devrait créer les éléments au premier appel de /api/elements')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkElements()
