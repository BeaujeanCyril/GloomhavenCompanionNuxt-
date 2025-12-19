// Script pour initialiser manuellement les données
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Initialisation des données...\n')

  // Vérifier les scénarios
  const scenarioCount = await prisma.scenario.count()
  console.log(`📊 Scénarios actuels : ${scenarioCount}`)

  if (scenarioCount === 0) {
    console.log('📝 Création de 95 scénarios...')

    const scenarios = []
    for (let i = 1; i <= 95; i++) {
      scenarios.push({
        id: i,
        name: `Scénario ${i}`,
        imagePath: `/img/Scenarios/gh-${i}.png`
      })
    }

    await prisma.scenario.createMany({
      data: scenarios,
      skipDuplicates: true
    })

    console.log('✅ 95 scénarios créés')
  } else {
    console.log('✅ Scénarios déjà présents')
  }

  // Vérifier les éléments
  const elementCount = await prisma.element.count()
  console.log(`\n📊 Éléments actuels : ${elementCount}`)

  if (elementCount === 0) {
    console.log('📝 Création de 6 éléments...')

    const elements = [
      { id: 1, name: 'Feu', imagePath: '/img/Elements/FirePicture.png' },
      { id: 2, name: 'Ténèbre', imagePath: '/img/Elements/DarknessPicture.png' },
      { id: 3, name: 'Terre', imagePath: '/img/Elements/EarthPicture.png' },
      { id: 4, name: 'Vent', imagePath: '/img/Elements/WindPicture.png' },
      { id: 5, name: 'Lumière', imagePath: '/img/Elements/LightPicture.png' },
      { id: 6, name: 'Givre', imagePath: '/img/Elements/FrostPicture.png' },
    ]

    await prisma.element.createMany({
      data: elements,
      skipDuplicates: true
    })

    console.log('✅ 6 éléments créés')
  } else {
    console.log('✅ Éléments déjà présents')
  }

  console.log('\n✨ Initialisation terminée !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
