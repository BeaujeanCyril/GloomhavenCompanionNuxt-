# Guide de Migration de la Base de Données

Ce guide vous aidera à migrer votre base de données vers la nouvelle structure complète.

## Vue d'ensemble des changements

### Nouvelles tables ajoutées

1. **Effect** - Effets appliqués aux joueurs
2. **CampaignScenario** - Table many-to-many entre Campaign et Scenario
3. **Game** - Représente une partie/jeu
4. **PlayerGame** - Table many-to-many entre Player et Game
5. **Round** - Tours de jeu
6. **Deck** - Decks de cartes (joueurs et monstres)
7. **Card** - Cartes individuelles
8. **Element** - Éléments du jeu (Feu, Ténèbre, etc.)

### Relations modifiées

- **Campaign ↔ Scenario** : Relation directe remplacée par la table intermédiaire `CampaignScenario`
- **Player** : Nouvelles relations avec `Effect`, `Deck`, et `PlayerGame`
- **Game** : Lié à `CampaignScenario`, `PlayerGame`, `Round`, et `Deck` (monstre)

## Étapes de migration

### 1. Installer les dépendances

```bash
npm install
```

Cela installera `tsx` et `@types/node` nécessaires pour le seed.

### 2. Configurer la connexion à la base de données

Assurez-vous que votre fichier `.env` contient la variable `DATABASE_URL` :

```env
DATABASE_URL="mysql://user:password@localhost:3306/gloomhaven_db"
```

### 3. Générer et appliquer la migration

#### Option A : Migration avec historique (recommandé)

```bash
npm run db:migrate
```

Prisma vous demandera de nommer la migration. Exemple : `complete_schema`

Cette commande :
- Crée un fichier de migration dans `prisma/migrations/`
- Applique la migration à la base de données
- Génère le client Prisma
- **Exécute automatiquement le seed** (Elements et Scenarios)

#### Option B : Push direct (pour développement)

```bash
npm run db:push
```

Ensuite, exécutez manuellement le seed :

```bash
npm run db:seed
```

### 4. Vérifier la migration

Ouvrez Prisma Studio pour vérifier que tout s'est bien passé :

```bash
npm run db:studio
```

Vérifiez que :
- ✅ La table `Element` contient 6 éléments
- ✅ La table `Scenario` contient 95 scénarios (ou le nombre correspondant aux images)
- ✅ Toutes les nouvelles tables sont créées

### 5. Régénérer le client Prisma

Si nécessaire, régénérez le client :

```bash
npx prisma generate
```

## Données seed

### Elements (6 éléments)

- Feu
- Ténèbre
- Terre
- Vent
- Lumière
- Givre

### Scenarios

Le script de seed crée automatiquement les scénarios de deux manières :

1. **À partir des images** : Si le dossier `public/img/Scenarios/` contient des fichiers `gh-1.png`, `gh-2.png`, etc.
2. **Par défaut** : Si aucune image n'est trouvée, crée 95 scénarios standards

## Commandes utiles

### Voir l'état de la base de données

```bash
npx prisma db pull
```

### Réinitialiser complètement la base de données

⚠️ **ATTENTION : Supprime toutes les données !**

```bash
npm run db:reset
```

Cette commande :
1. Supprime la base de données
2. Recrée la base de données
3. Applique toutes les migrations
4. Exécute le seed

### Exécuter uniquement le seed

```bash
npm run db:seed
```

### Créer une nouvelle migration

```bash
npm run db:migrate
```

## Structure de la base de données

### Diagramme des relations principales

```
Campaign
  ├── players (1-N) → Player
  └── campaignScenarios (1-N) → CampaignScenario
                                   ├── scenario (N-1) → Scenario
                                   └── game (1-1) → Game
                                                      ├── playerGames (1-N) → PlayerGame
                                                      ├── rounds (1-N) → Round
                                                      └── monsterDeck (1-1) → Deck

Player
  ├── campaign (N-1) → Campaign
  ├── deck (1-1) → Deck
  ├── effects (1-N) → Effect
  └── playerGames (1-N) → PlayerGame

Deck
  ├── cards (1-N) → Card
  ├── player (1-1) → Player
  └── gameAsMonster (1-1) → Game
```

## Vérification de l'intégrité

### Requêtes de test

```typescript
// Vérifier qu'une campagne avec joueurs fonctionne
const campaign = await prisma.campaign.findFirst({
  include: {
    players: {
      include: {
        deck: true,
        effects: true
      }
    },
    campaignScenarios: {
      include: {
        scenario: true,
        game: {
          include: {
            rounds: true,
            playerGames: true,
            monsterDeck: {
              include: {
                cards: true
              }
            }
          }
        }
      }
    }
  }
})
```

## Problèmes connus et solutions

### Erreur : "Table already exists"

Si vous avez déjà des tables, utilisez :

```bash
npm run db:reset
```

Ou supprimez manuellement les tables en conflit.

### Erreur : "tsx command not found"

Installez les dépendances :

```bash
npm install
```

### Les scénarios ne sont pas créés

Vérifiez que le dossier `public/img/Scenarios/` existe ou laissez le seed créer les scénarios par défaut.

### Erreur de connexion à la base de données

Vérifiez votre `DATABASE_URL` dans le fichier `.env`.

## Migration depuis l'ancienne structure

Si vous avez déjà des données dans l'ancienne structure :

1. **Sauvegardez vos données** :
   ```bash
   mysqldump -u user -p gloomhaven_db > backup.sql
   ```

2. **Exécutez la migration** :
   ```bash
   npm run db:migrate
   ```

3. **Script de migration de données** (si nécessaire) :

```typescript
// Exemple : Migrer les scénarios directs vers CampaignScenario
const campaigns = await prisma.campaign.findMany({
  include: { scenarios: true }
})

for (const campaign of campaigns) {
  for (const scenario of campaign.scenarios) {
    await prisma.campaignScenario.create({
      data: {
        campaignId: campaign.id,
        scenarioId: scenario.id,
        isFinished: scenario.isFinished
      }
    })
  }
}
```

## Checklist finale

- [ ] Variables d'environnement configurées
- [ ] Migration appliquée avec succès
- [ ] Seed exécuté (6 Elements, 95 Scenarios)
- [ ] Client Prisma généré
- [ ] Tests de base effectués
- [ ] Backup de l'ancienne base (si applicable)

## Support

Pour toute question ou problème, consultez :
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation Nuxt 3](https://nuxt.com/docs)
