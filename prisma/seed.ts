import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Démarrage du seed...')

  // Seed des Elements
  await seedElements()

  // Seed des Scenarios
  await seedScenarios()

  console.log('✅ Seed terminé avec succès!')
}

async function seedElements() {
  console.log('📦 Seed des éléments...')

  const elements = [
    { id: 1, name: 'Feu', imagePath: '/img/Elements/FirePicture.png' },
    { id: 2, name: 'Ténèbre', imagePath: '/img/Elements/DarknessPicture.png' },
    { id: 3, name: 'Terre', imagePath: '/img/Elements/EarthPicture.png' },
    { id: 4, name: 'Vent', imagePath: '/img/Elements/WindPicture.png' },
    { id: 5, name: 'Lumière', imagePath: '/img/Elements/LightPicture.png' },
    { id: 6, name: 'Givre', imagePath: '/img/Elements/FrostPicture.png' },
  ]

  for (const element of elements) {
    await prisma.element.upsert({
      where: { id: element.id },
      update: {},
      create: element,
    })
  }

  console.log(`  ✓ ${elements.length} éléments créés`)
}

async function seedScenarios() {
  console.log('📦 Seed des scénarios...')

  // Chemin vers le dossier des images de scénarios
  const folderPath = path.join(process.cwd(), 'public', 'img', 'Scenarios')

  // Vérifier si le dossier existe
  if (!fs.existsSync(folderPath)) {
    console.log(`  ⚠️  Le dossier ${folderPath} n'existe pas. Création des scénarios par défaut...`)
    await createDefaultScenarios()
    return
  }

  // Lire tous les fichiers du dossier
  const files = fs.readdirSync(folderPath)
  const pngFiles = files.filter(file => file.match(/^gh-\d+\.png$/))

  if (pngFiles.length === 0) {
    console.log('  ⚠️  Aucun fichier de scénario trouvé. Création des scénarios par défaut...')
    await createDefaultScenarios()
    return
  }

  let count = 0
  for (const file of pngFiles) {
    const match = file.match(/^gh-(\d+)\.png$/)
    if (match) {
      const scenarioId = parseInt(match[1])
      await prisma.scenario.upsert({
        where: { id: scenarioId },
        update: {},
        create: {
          id: scenarioId,
          name: `Scénario ${scenarioId}`,
          imagePath: `/img/Scenarios/${file}`,
        },
      })
      count++
    }
  }

  console.log(`  ✓ ${count} scénarios créés à partir des images`)
}

async function createDefaultScenarios() {
  // Créer 95 scénarios par défaut (comme dans l'API)
  const scenarios = []
  for (let i = 1; i <= 95; i++) {
    scenarios.push({
      id: i,
      name: `Scénario ${i}`,
      imagePath: `/img/Scenarios/gh-${i}.png`,
    })
  }

  let count = 0
  for (const scenario of scenarios) {
    await prisma.scenario.upsert({
      where: { id: scenario.id },
      update: {},
      create: scenario,
    })
    count++
  }

  console.log(`  ✓ ${count} scénarios par défaut créés`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
