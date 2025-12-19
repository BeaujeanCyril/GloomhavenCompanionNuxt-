# Gloomhaven Companion - Nuxt 3

Application web pour gérer vos campagnes Gloomhaven, construite avec Nuxt 3, Prisma et MySQL.

## ✨ Fonctionnalités

- 🎮 **Gestion de campagnes** : Créez et gérez plusieurs campagnes simultanément
- 👥 **Gestion de joueurs** : Ajoutez des joueurs avec leurs statistiques (PV, pièces, XP)
- 🗺️ **95 scénarios** : Tous les scénarios du jeu de base Gloomhaven
- 🔥 **Éléments** : Gestion des 6 éléments (Feu, Ténèbre, Terre, Vent, Lumière, Givre)
- 🃏 **Decks de cartes** : Gestion des decks de modificateurs
- 🎲 **Système de jeu** : Tours, rounds et état de partie
- 📊 **Effets** : Suivi des effets appliqués aux joueurs
- 🔄 **Auto-initialisation** : Les données de base sont créées automatiquement au premier lancement

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- MySQL 8+
- npm ou yarn

### Installation

1. **Cloner le projet**

```bash
git clone <votre-repo>
cd GloomhavenCompanionNuxt
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer la base de données**

Créez un fichier `.env` à la racine :

```env
DATABASE_URL="mysql://user:password@localhost:3306/gloomhaven_db"
```

4. **Créer la structure de base de données**

```bash
npm run db:push
```

Ou avec migrations (recommandé pour production) :

```bash
npm run db:migrate
```

5. **Lancer l'application**

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

**✨ Les scénarios et éléments seront automatiquement créés au premier accès !**

## 📦 Scripts disponibles

```bash
# Développement
npm run dev              # Lancer le serveur de développement
npm run build            # Build pour production
npm run preview          # Prévisualiser le build de production

# Base de données
npm run db:migrate       # Créer et appliquer une migration
npm run db:push          # Push du schéma sans migration
npm run db:seed          # Exécuter le seed manuellement
npm run db:studio        # Ouvrir Prisma Studio (interface graphique)
npm run db:reset         # Réinitialiser complètement la DB (⚠️ supprime les données)
```

## 🗄️ Structure de la base de données

### Tables principales

- **Campaign** : Campagnes de jeu
- **Player** : Joueurs associés à une campagne
- **Scenario** : 95 scénarios du jeu de base
- **CampaignScenario** : Liaison many-to-many entre Campaign et Scenario
- **Game** : Parties en cours ou terminées
- **PlayerGame** : Liaison many-to-many entre Player et Game
- **Round** : Tours de jeu
- **Deck** : Decks de cartes (joueurs et monstres)
- **Card** : Cartes individuelles
- **Element** : 6 éléments du jeu
- **Effect** : Effets appliqués aux joueurs

Voir [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) pour plus de détails.

## 🔌 API

### Endpoints principaux

#### Campagnes

```typescript
// Créer une campagne avec joueurs
POST /api/campaigns
{
  "companyName": "Les Héros de Gloomhaven",
  "players": [
    { "name": "Aragorn", "healthPointsMax": 10, "coins": 30 },
    { "name": "Legolas", "healthPointsMax": 8, "xp": 5 }
  ]
}

// Récupérer toutes les campagnes
GET /api/campaigns

// Récupérer une campagne spécifique
GET /api/campaigns/:id
```

#### Scénarios

```typescript
// Récupérer tous les scénarios (auto-initialise si vide)
GET /api/scenarios
```

#### Éléments

```typescript
// Récupérer tous les éléments (auto-initialise si vide)
GET /api/elements
```

Voir [API_USAGE.md](API_USAGE.md) pour la documentation complète.

## 🎨 Stack technique

- **Framework** : [Nuxt 3](https://nuxt.com/)
- **UI** : Vue 3 + Tailwind CSS
- **State Management** : [Pinia](https://pinia.vuejs.org/)
- **Backend** : Nitro (serveur Nuxt)
- **ORM** : [Prisma](https://www.prisma.io/)
- **Base de données** : MySQL
- **Notifications** : vue-toastification

## 📚 Documentation

- [API_USAGE.md](API_USAGE.md) - Documentation complète de l'API avec exemples
- [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) - Guide de migration de la base de données
- [AUTO_INITIALIZATION.md](AUTO_INITIALIZATION.md) - Système d'auto-initialisation des données
- [CHANGELOG.md](CHANGELOG.md) - Historique des versions

## 🌟 Fonctionnalités avancées

### Auto-initialisation

Au premier lancement, l'application vérifie automatiquement si les tables `Scenario` et `Element` sont vides, et les initialise si nécessaire :

- **Scénarios** : Détecte les images dans `public/img/Scenarios/` (format `gh-*.png`) ou crée 95 scénarios par défaut
- **Éléments** : Crée les 6 éléments du jeu

Aucune action manuelle requise ! 🎉

### Gestion des images

Placez vos images de scénarios dans `public/img/Scenarios/` avec le format :

```
public/img/Scenarios/
  ├── gh-1.png
  ├── gh-2.png
  ├── gh-3.png
  └── ...
```

Elles seront automatiquement détectées et utilisées.

### Prisma Studio

Explorez et modifiez vos données avec une interface graphique :

```bash
npm run db:studio
```

Ouvre `http://localhost:5555` avec une interface d'administration complète.

## 🔧 Configuration

### Variables d'environnement

```env
# Base de données (obligatoire)
DATABASE_URL="mysql://user:password@localhost:3306/gloomhaven_db"

# Nuxt (optionnel)
NUXT_PUBLIC_API_BASE=/api
```

### Personnalisation

- **Scénarios** : Modifiez `server/utils/initScenarios.ts`
- **Éléments** : Modifiez `server/utils/initElements.ts`
- **Schéma DB** : Modifiez `prisma/schema.prisma` puis lancez `npm run db:migrate`

## 🐛 Debugging

### Logs serveur

Les fonctions d'initialisation affichent des logs utiles :

```bash
✓ 95 scénarios déjà présents dans la base de données
✓ 6 éléments déjà présents dans la base de données
```

### Prisma Studio

Pour visualiser et débugger les données :

```bash
npm run db:studio
```

### Réinitialisation complète

Si vous rencontrez des problèmes :

```bash
npm run db:reset
```

⚠️ **Attention** : Cela supprime toutes les données !

## 📝 Contribution

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📄 License

Ce projet est sous licence MIT.

## 🙏 Remerciements

- [Gloomhaven](https://boardgamegeek.com/boardgame/174430/gloomhaven) par Isaac Childres
- Inspiré par le projet .NET original

## 📞 Support

Pour toute question ou problème :
- Consultez la [documentation](API_USAGE.md)
- Ouvrez une [issue](https://github.com/votre-repo/issues)

---

Fait avec ❤️ pour la communauté Gloomhaven
