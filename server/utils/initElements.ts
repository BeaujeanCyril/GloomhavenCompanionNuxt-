import prisma from './db'

/**
 * Initialise les éléments dans la base de données si elle est vide
 * Crée les 6 éléments du jeu Gloomhaven
 */
export async function ensureElementsExist() {
  try {
    // Vérifier si des éléments existent déjà
    const count = await prisma.element.count()

    if (count > 0) {
      console.log(`✓ ${count} éléments déjà présents dans la base de données`)
      return count
    }

    console.log('🔄 Aucun élément trouvé, initialisation en cours...')

    // Définir les 6 éléments
    const elements = [
      { id: 1, name: 'Feu', imagePath: '/img/Elements/FirePicture.png' },
      { id: 2, name: 'Ténèbre', imagePath: '/img/Elements/DarknessPicture.png' },
      { id: 3, name: 'Terre', imagePath: '/img/Elements/EarthPicture.png' },
      { id: 4, name: 'Vent', imagePath: '/img/Elements/WindPicture.png' },
      { id: 5, name: 'Lumière', imagePath: '/img/Elements/LightPicture.png' },
      { id: 6, name: 'Givre', imagePath: '/img/Elements/FrostPicture.png' },
    ]

    // Insertion en batch
    await prisma.element.createMany({
      data: elements,
      skipDuplicates: true
    })

    console.log(`✓ ${elements.length} éléments créés`)

    return elements.length
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des éléments:', error)
    throw error
  }
}
