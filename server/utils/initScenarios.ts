import prisma from './db'
import fs from 'fs'
import path from 'path'

/**
 * Initialise les scénarios dans la base de données si elle est vide
 * Scanne le dossier public/img/Scenarios pour trouver les images gh-*.png
 * ou crée 95 scénarios par défaut
 */
export async function ensureScenariosExist() {
  try {
    // Vérifier si des scénarios existent déjà
    const count = await prisma.scenario.count()

    if (count > 0) {
      console.log(`✓ ${count} scénarios déjà présents dans la base de données`)
      return count
    }

    console.log('🔄 Aucun scénario trouvé, initialisation en cours...')

    // Chemin vers le dossier des images
    const publicPath = path.join(process.cwd(), 'public', 'img', 'Scenarios')

    let scenariosCreated = 0

    // Vérifier si le dossier existe
    if (fs.existsSync(publicPath)) {
      // Lire tous les fichiers du dossier
      const files = fs.readdirSync(publicPath)
      const scenarioFiles = files.filter(file => file.match(/^gh-\d+\.png$/))

      if (scenarioFiles.length > 0) {
        console.log(`📁 ${scenarioFiles.length} images de scénarios trouvées`)

        // Créer les scénarios à partir des images
        for (const file of scenarioFiles) {
          const match = file.match(/^gh-(\d+)\.png$/)
          if (match) {
            const scenarioId = parseInt(match[1])
            await prisma.scenario.create({
              data: {
                id: scenarioId,
                name: `Scénario ${scenarioId}`,
                imagePath: `/img/Scenarios/${file}`
              }
            })
            scenariosCreated++
          }
        }

        console.log(`✓ ${scenariosCreated} scénarios créés à partir des images`)
        return scenariosCreated
      }
    }

    // Si aucune image n'est trouvée, créer 95 scénarios par défaut
    console.log('📝 Aucune image trouvée, création des scénarios par défaut...')

    const scenarios = []
    for (let i = 1; i <= 95; i++) {
      scenarios.push({
        id: i,
        name: `Scénario ${i}`,
        imagePath: `/img/Scenarios/gh-${i}.png`
      })
    }

    // Insertion en batch pour plus de performance
    await prisma.scenario.createMany({
      data: scenarios,
      skipDuplicates: true
    })

    scenariosCreated = scenarios.length
    console.log(`✓ ${scenariosCreated} scénarios par défaut créés`)

    return scenariosCreated
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des scénarios:', error)
    throw error
  }
}
