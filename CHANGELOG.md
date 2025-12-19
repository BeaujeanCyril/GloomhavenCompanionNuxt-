# Changelog - Gloomhaven Companion Nuxt

## [2.0.0] - 2025-11-16

### 🎉 Améliorations majeures

#### API

- **Création de campagnes avec joueurs** : L'endpoint `POST /api/campaigns` accepte maintenant un tableau de joueurs à créer en une seule requête
- **Auto-initialisation des données** : Les scénarios et éléments sont automatiquement créés au premier appel de l'API
- **Nouveaux endpoints** :
  - `GET /api/elements` - Récupère les éléments avec auto-initialisation
  - `GET /api/scenarios` - Récupère les scénarios depuis la DB avec auto-initialisation

#### Base de données (Prisma)

- **Schéma complet** aligné avec le DbContext .NET
- **Nouvelles tables** :
  - `Element` - Les 6 éléments du jeu
  - `Effect` - Effets appliqués aux joueurs
  - `CampaignScenario` - Table many-to-many Campaign ↔ Scenario
  - `Game` - Représente une partie
  - `PlayerGame` - Table many-to-many Player ↔ Game avec clé composite
  - `Round` - Tours de jeu
  - `Deck` - Decks de cartes
  - `Card` - Cartes individuelles
- **Relations améliorées** :
  - Campaign → Player (one-to-many avec cascade)
  - Campaign → CampaignScenario (one-to-many)
  - Scenario → CampaignScenario (one-to-many)
  - Player → Deck (one-to-one)
  - Player → Effect (one-to-many)
  - Game → PlayerGame (one-to-many)
  - Game → Round (one-to-many)
  - Deck → Card (one-to-many)

#### Types TypeScript

- **Nouveaux types** :
  - `CreatePlayerInput` - Pour la création de joueurs via API
  - `CreateCampaignInput` - Pour la création de campagnes avec joueurs

#### Store Pinia

- **`addCampaign()`** : Accepte maintenant `CreateCampaignInput` pour créer une campagne avec joueurs
- **`loadElements()`** : Charge les éléments depuis l'API au lieu de les générer statiquement
- **Gestion d'erreurs améliorée** pour les appels API

#### Utilitaires serveur

- **`server/utils/initScenarios.ts`** : Fonction `ensureScenariosExist()` pour auto-initialisation
- **`server/utils/initElements.ts`** : Fonction `ensureElementsExist()` pour auto-initialisation

#### Scripts npm

Nouveaux scripts ajoutés au `package.json` :
```bash
npm run db:migrate   # Créer et appliquer une migration
npm run db:push      # Push du schéma sans migration
npm run db:seed      # Exécuter le seed manuellement
npm run db:studio    # Ouvrir Prisma Studio
npm run db:reset     # Réinitialiser la DB
```

#### Documentation

- **`API_USAGE.md`** : Documentation complète de l'API avec exemples
- **`DATABASE_MIGRATION.md`** : Guide de migration de la base de données
- **`AUTO_INITIALIZATION.md`** : Documentation du système d'auto-initialisation

### 🔧 Changements techniques

#### Validation

L'endpoint `POST /api/campaigns` valide maintenant :
- Nom de compagnie obligatoire et non vide
- Nom de joueur obligatoire pour chaque joueur
- Points de vie maximum > 0 pour chaque joueur
- Coins et XP optionnels (défaut : 0)

#### Optimisations

- Utilisation de `createMany()` pour insertions en batch
- `skipDuplicates: true` pour éviter les erreurs
- Vérification rapide avec `count()` avant insertion
- Relations Prisma avec `include` pour réduire les requêtes

#### Détection automatique

- Scanne le dossier `public/img/Scenarios/` pour détecter les images `gh-*.png`
- Crée les scénarios basés sur les images trouvées
- Fallback sur 95 scénarios par défaut si aucune image

### 📦 Dépendances

Nouvelles dépendances de développement :
- `tsx@^4.7.0` - Pour exécuter le seed TypeScript
- `@types/node@^20.0.0` - Types Node.js

### 🗑️ Suppressions

- Génération statique des scénarios dans le store (remplacé par chargement depuis DB)
- Génération statique des éléments dans le store (remplacé par chargement depuis DB)

### 📝 Migration depuis v1.x

#### Étape 1 : Installer les dépendances

```bash
npm install
```

#### Étape 2 : Appliquer la migration

```bash
npm run db:migrate
```

Cela créera toutes les nouvelles tables et exécutera le seed automatiquement.

#### Étape 3 : Vérifier

```bash
npm run db:studio
```

Vérifiez que :
- ✅ 6 éléments sont présents
- ✅ 95 scénarios sont présents
- ✅ Toutes les tables sont créées

### 🐛 Corrections

- Fix : Les scénarios sont maintenant persistants en base de données
- Fix : Les éléments sont maintenant persistants en base de données
- Fix : Relations many-to-many correctement implémentées

### ⚡ Performance

- Première initialisation : ~500ms-1s (création des données)
- Appels suivants : ~10-50ms (vérification uniquement)
- Réduction des requêtes grâce aux relations Prisma

### 🔒 Sécurité

- Validation stricte des données d'entrée
- Messages d'erreur clairs en français
- Cascade delete pour maintenir l'intégrité référentielle
- Protection contre les doublons avec contraintes uniques

### 📚 Documentation complète

Consultez les fichiers suivants pour plus de détails :
- [API_USAGE.md](API_USAGE.md) - Guide d'utilisation de l'API
- [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) - Guide de migration
- [AUTO_INITIALIZATION.md](AUTO_INITIALIZATION.md) - Système d'auto-initialisation

---

## [1.0.0] - Initial Release

Version initiale avec fonctionnalités de base.
