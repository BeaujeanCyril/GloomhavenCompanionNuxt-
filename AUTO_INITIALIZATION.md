# Système d'Auto-Initialisation

## Vue d'ensemble

Le système d'auto-initialisation permet de créer automatiquement les données de base (Scénarios et Éléments) au premier lancement de l'application, sans nécessiter de migration manuelle ou de script séparé.

## Fonctionnement

### Principe

Lorsqu'un utilisateur accède à l'application pour la première fois :

1. L'application appelle les endpoints `/api/scenarios` ou `/api/elements`
2. Les endpoints vérifient si les tables correspondantes contiennent des données
3. Si les tables sont vides, les données sont automatiquement insérées
4. Les données sont ensuite retournées à l'application

### Avantages

- ✅ Pas besoin d'exécuter manuellement `npm run db:seed`
- ✅ Fonctionne automatiquement au premier lancement
- ✅ Idempotent : peut être appelé plusieurs fois sans créer de doublons
- ✅ Détecte automatiquement les images de scénarios disponibles
- ✅ Crée des données par défaut si aucune image n'est disponible

## Fichiers impliqués

### 1. Utilitaires serveur

#### [`server/utils/initScenarios.ts`](server/utils/initScenarios.ts)

Fonction `ensureScenariosExist()` :
- Vérifie si la table `Scenario` contient des données
- Si vide, scanne le dossier `public/img/Scenarios/` pour les images `gh-*.png`
- Crée les scénarios basés sur les images trouvées
- Si aucune image, crée 95 scénarios par défaut

```typescript
await ensureScenariosExist()
// ✓ 95 scénarios créés (ou basés sur les images)
```

#### [`server/utils/initElements.ts`](server/utils/initElements.ts)

Fonction `ensureElementsExist()` :
- Vérifie si la table `Element` contient des données
- Si vide, crée les 6 éléments du jeu (Feu, Ténèbre, Terre, Vent, Lumière, Givre)

```typescript
await ensureElementsExist()
// ✓ 6 éléments créés
```

### 2. Endpoints API

#### [`server/api/scenarios/index.get.ts`](server/api/scenarios/index.get.ts)

```typescript
export default defineEventHandler(async () => {
    // Auto-initialisation si la table est vide
    await ensureScenariosExist()

    // Récupération depuis la DB
    const scenarios = await prisma.scenario.findMany({
        orderBy: { id: 'asc' }
    })

    return scenarios
})
```

#### [`server/api/elements/index.get.ts`](server/api/elements/index.get.ts)

```typescript
export default defineEventHandler(async () => {
    // Auto-initialisation si la table est vide
    await ensureElementsExist()

    // Récupération depuis la DB
    const elements = await prisma.element.findMany({
        orderBy: { id: 'asc' }
    })

    return elements
})
```

### 3. Store Pinia

#### [`stores/app.ts`](stores/app.ts)

Méthode `initialize()` mise à jour pour charger depuis l'API :

```typescript
async initialize() {
    await this.loadElements()      // Charge depuis /api/elements
    await this.generateScenarios() // Charge depuis /api/scenarios
}

async loadElements() {
    const { data } = await useFetch<Element[]>('/api/elements')
    if (data.value) {
        // Ajoute la propriété 'state' pour l'état client-side
        this.elements = data.value.map(element => ({
            ...element,
            state: 0
        }))
    }
}
```

## Détection des images de scénarios

Le système détecte automatiquement les images dans `public/img/Scenarios/` :

### Format attendu

```
public/img/Scenarios/
  ├── gh-1.png
  ├── gh-2.png
  ├── gh-3.png
  └── ...
```

### Comportement

**Si des images sont trouvées :**
```
📁 42 images de scénarios trouvées
✓ 42 scénarios créés à partir des images
```

**Si aucune image n'est trouvée :**
```
📝 Aucune image trouvée, création des scénarios par défaut...
✓ 95 scénarios par défaut créés
```

## Logs de débogage

Les fonctions d'initialisation affichent des logs dans la console serveur :

### Scénarios

```bash
# Première exécution
🔄 Aucun scénario trouvé, initialisation en cours...
📁 95 images de scénarios trouvées
✓ 95 scénarios créés à partir des images

# Exécutions suivantes
✓ 95 scénarios déjà présents dans la base de données
```

### Éléments

```bash
# Première exécution
🔄 Aucun élément trouvé, initialisation en cours...
✓ 6 éléments créés

# Exécutions suivantes
✓ 6 éléments déjà présents dans la base de données
```

## Performances

### Optimisations

1. **Vérification rapide** : Un simple `count()` avant d'insérer
2. **Insertion en batch** : Utilisation de `createMany()` pour les insertions multiples
3. **Skip duplicates** : `skipDuplicates: true` évite les erreurs de doublons

### Impact

- **Première exécution** : ~500ms-1s (création des données)
- **Exécutions suivantes** : ~10-50ms (vérification uniquement)

## Comparaison avec le seed manuel

| Critère | Auto-initialisation | Seed manuel |
|---------|-------------------|-------------|
| Commande requise | ❌ Aucune | ✅ `npm run db:seed` |
| Premier lancement | ✅ Automatique | ❌ Manuel |
| Détection d'images | ✅ Oui | ✅ Oui |
| Logs visibles | ✅ Console serveur | ✅ Terminal |
| Idempotent | ✅ Oui | ✅ Oui (upsert) |
| Environnement | ✅ Tous | ❌ Dev uniquement |

## Cas d'usage

### Développement local

```bash
# 1. Cloner le projet
git clone <repo>

# 2. Installer les dépendances
npm install

# 3. Configurer la DB
DATABASE_URL="mysql://user:password@localhost:3306/gloomhaven"

# 4. Créer la structure
npm run db:push

# 5. Lancer l'app
npm run dev

# ✨ Les données sont automatiquement créées au premier accès
```

### Production / Déploiement

```bash
# 1. Build
npm run build

# 2. Lancer
npm run preview

# ✨ Les données sont automatiquement créées au premier accès
```

### Tests / CI/CD

Les données sont créées automatiquement lors du premier test, sans configuration supplémentaire.

## Migration depuis l'ancien système

Si vous utilisez actuellement `generateScenarios()` dans le store :

### Avant

```typescript
// Store générait des données statiques
generateScenarios() {
    this.scenarios = []
    for (let i = 1; i <= 95; i++) {
        this.scenarios.push({
            id: i,
            name: `Scenario ${i}`,
            imagePath: `/img/Scenarios/gh-${i}.png`,
            isFinished: false
        })
    }
}
```

### Après

```typescript
// Store charge depuis l'API (qui auto-initialise si nécessaire)
async generateScenarios() {
    const { data } = await useFetch<Scenario[]>('/api/scenarios')
    if (data.value) {
        this.scenarios = data.value
    }
}
```

## Maintenance

### Ajouter de nouveaux scénarios

1. Ajoutez les images dans `public/img/Scenarios/` (format `gh-X.png`)
2. Supprimez les scénarios existants : `DELETE FROM Scenario;`
3. Rechargez l'application : les nouveaux scénarios seront détectés

### Modifier les éléments

Modifiez le fichier [`server/utils/initElements.ts`](server/utils/initElements.ts) et supprimez les éléments existants.

## Troubleshooting

### Les scénarios ne sont pas créés

**Vérifiez :**
1. La connexion à la base de données (`DATABASE_URL`)
2. Les permissions sur le dossier `public/img/Scenarios/`
3. Les logs de la console serveur

### Doublons de scénarios

Les doublons sont normalement évités avec `skipDuplicates: true`. Si vous en avez :

```bash
# Réinitialiser la table
npm run db:reset
```

### Performances lentes

Si la première initialisation est lente :
1. Vérifiez la latence de la base de données
2. Réduisez le nombre de scénarios si nécessaire
3. Les exécutions suivantes sont beaucoup plus rapides

## Conclusion

Le système d'auto-initialisation simplifie grandement le déploiement et l'utilisation de l'application, en éliminant le besoin de commandes manuelles de seed. Les données sont créées intelligemment au premier accès, rendant l'expérience utilisateur fluide et sans friction.
