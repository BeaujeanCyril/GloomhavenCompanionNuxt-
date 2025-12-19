# Guide de résolution rapide

## Problème rencontré

Vous avez probablement rencontré deux erreurs :

1. **Erreur Prisma** : `Unknown field 'scenarios' for include statement on model Campaign`
2. **Table Scenario vide** : Aucun scénario dans la base de données

## ✅ Corrections appliquées

### 1. Endpoints corrigés

Les endpoints suivants ont été mis à jour pour utiliser `campaignScenarios` au lieu de `scenarios` :

- ✅ [server/api/campaigns/index.post.ts](server/api/campaigns/index.post.ts)
- ✅ [server/api/campaigns.get.ts](server/api/campaigns.get.ts)
- ✅ [server/api/campaigns/[id].get.ts](server/api/campaigns/[id].get.ts)

### 2. Script d'initialisation créé

Un nouveau script a été créé : [scripts/init-data.ts](scripts/init-data.ts)

## 🚀 Solution étape par étape

### Étape 1 : Arrêter le serveur Nuxt

Si votre serveur de développement est en cours d'exécution, arrêtez-le avec `Ctrl+C`.

### Étape 2 : Générer le client Prisma

```bash
npx prisma generate
```

Cette commande régénère le client Prisma avec le nouveau schéma.

### Étape 3 : Initialiser les données

```bash
npm run db:init
```

Ce script va :
- ✅ Créer 95 scénarios dans la table `Scenario`
- ✅ Créer 6 éléments dans la table `Element`
- ✅ Afficher un rapport dans la console

### Étape 4 : Vérifier les données

Ouvrez Prisma Studio pour vérifier :

```bash
npm run db:studio
```

Dans votre navigateur (`http://localhost:5555`) :
- Vérifiez que la table `Scenario` contient 95 entrées
- Vérifiez que la table `Element` contient 6 entrées

### Étape 5 : Relancer le serveur

```bash
npm run dev
```

### Étape 6 : Tester la création de campagne

Essayez à nouveau de créer une campagne avec joueurs :

```typescript
POST /api/campaigns
{
  "companyName": "Test",
  "players": [
    { "name": "Cy", "healthPointsMax": 5 },
    { "name": "Lo", "healthPointsMax": 8 }
  ]
}
```

## 🔍 Vérification des logs

Le serveur affichera des logs lors de l'initialisation :

```bash
# Au premier appel de /api/scenarios
✓ 95 scénarios déjà présents dans la base de données

# Au premier appel de /api/elements
✓ 6 éléments déjà présents dans la base de données
```

## 📊 Structure des données retournées

### Avant (incorrect)

```json
{
  "id": 1,
  "companyName": "Test",
  "players": [...],
  "scenarios": [...] // ❌ N'existe plus
}
```

### Après (correct)

```json
{
  "id": 1,
  "companyName": "Test",
  "players": [...],
  "campaignScenarios": [  // ✅ Nouvelle structure
    {
      "id": 1,
      "campaignId": 1,
      "scenarioId": 1,
      "isFinished": false,
      "scenario": {
        "id": 1,
        "name": "Scénario 1",
        "imagePath": "/img/Scenarios/gh-1.png"
      }
    }
  ]
}
```

## 🔄 Adapter le frontend

Si vous devez adapter votre code frontend pour la nouvelle structure :

### Ancien code

```typescript
campaign.scenarios.forEach(scenario => {
  // ...
})
```

### Nouveau code

```typescript
campaign.campaignScenarios.forEach(cs => {
  const scenario = cs.scenario
  const isFinished = cs.isFinished
  // ...
})
```

## ❓ FAQ

### Q : Pourquoi `campaignScenarios` au lieu de `scenarios` ?

**R :** La nouvelle structure utilise une table many-to-many explicite (`CampaignScenario`) qui permet de :
- Stocker si un scénario est terminé pour une campagne spécifique
- Lier un scénario à plusieurs campagnes
- Associer un jeu (`Game`) à un scénario dans le contexte d'une campagne

### Q : Les scénarios ne s'initialisent toujours pas automatiquement ?

**R :** L'auto-initialisation fonctionne uniquement lors de l'appel à `/api/scenarios` ou `/api/elements`. Si vous créez directement une campagne sans avoir appelé ces endpoints, exécutez :

```bash
npm run db:init
```

### Q : Comment réinitialiser complètement la base de données ?

**R :** Utilisez cette commande (⚠️ supprime toutes les données) :

```bash
npm run db:reset
```

Puis initialisez les données :

```bash
npm run db:init
```

## 🎯 Résumé rapide

```bash
# 1. Arrêter le serveur (Ctrl+C)

# 2. Générer le client Prisma
npx prisma generate

# 3. Initialiser les données
npm run db:init

# 4. Relancer le serveur
npm run dev

# 5. Tester la création de campagne
```

Votre application devrait maintenant fonctionner correctement ! ✨
