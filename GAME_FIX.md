# Fix - Composants manquants dans le jeu

## Problème rencontré

Lorsque vous lancez une partie après avoir sélectionné un scénario, les composants ne s'affichent pas :
- ❌ Deck de monstres
- ❌ Rounds
- ❌ Players
- ❌ Elements

## Cause racine

Le problème vient de la migration de la structure de données. L'API retourne maintenant `campaignScenarios` au lieu de `scenarios`, mais le code frontend s'attend toujours à `scenarios`.

### Ancien modèle (qui ne marche plus)

```typescript
Campaign {
  id: 1,
  companyName: "Test",
  players: [...],
  scenarios: [...]  // ❌ N'existe plus dans l'API
}
```

### Nouveau modèle (API)

```typescript
Campaign {
  id: 1,
  companyName: "Test",
  players: [...],
  campaignScenarios: [  // ✅ Nouvelle structure
    {
      id: 1,
      scenarioId: 5,
      isFinished: false,
      scenario: { id: 5, name: "Scénario 5", imagePath: "..." },
      game: { ... }  // État de la partie
    }
  ]
}
```

## ✅ Solutions appliquées

### 1. Mise à jour des types TypeScript

**Fichier** : [types/index.ts:3-20](types/index.ts#L3-L20)

Ajout du type `CampaignScenario` et mise à jour de `Campaign` :

```typescript
export interface CampaignScenario {
    id?: number
    campaignId: number
    scenarioId: number
    isFinished: boolean
    gameId?: number | null
    scenario?: Scenario
    game?: Game | null
}

export interface Campaign {
    id?: number
    companyName: string
    players: Player[]
    campaignScenarios?: CampaignScenario[]  // ✅ Nouvelle propriété
    scenarios?: Scenario[]                   // ⚠️ Helper pour compatibilité
}
```

### 2. Fonction de normalisation dans le store

**Fichier** : [stores/app.ts:97-112](stores/app.ts#L97-L112)

Ajout d'une fonction `normalizeCampaign()` qui transforme `campaignScenarios` en `scenarios` pour la compatibilité avec le code existant :

```typescript
normalizeCampaign(campaign: Campaign): Campaign {
    // Extraire les scénarios depuis campaignScenarios pour compatibilité
    if (campaign.campaignScenarios && campaign.campaignScenarios.length > 0) {
        campaign.scenarios = campaign.campaignScenarios.map(cs => ({
            id: cs.scenario!.id,
            name: cs.scenario!.name,
            imagePath: cs.scenario!.imagePath,
            isFinished: cs.isFinished,
            game: cs.game  // ✅ Préserve l'état du jeu
        }))
    } else {
        campaign.scenarios = []
    }
    return campaign
}
```

### 3. Application de la normalisation

La fonction est appliquée dans toutes les méthodes qui chargent des campagnes :

#### `addCampaign()` - [stores/app.ts:59-75](stores/app.ts#L59-L75)

```typescript
async addCampaign(newCampaign: Campaign | CreateCampaignInput) {
    const { data, error } = await useFetch<Campaign>('/api/campaigns', {
        method: 'POST',
        body: newCampaign
    })

    if (data.value) {
        const normalizedCampaign = this.normalizeCampaign(data.value)
        this.campaigns.push(normalizedCampaign)
        this.currentCampaign = normalizedCampaign
        return normalizedCampaign
    }
}
```

#### `loadCampaigns()` - [stores/app.ts:77-82](stores/app.ts#L77-L82)

```typescript
async loadCampaigns() {
    const { data } = await useFetch<Campaign[]>('/api/campaigns')
    if (data.value) {
        this.campaigns = data.value.map(c => this.normalizeCampaign(c))
    }
}
```

#### `loadCampaignById()` - [stores/app.ts:90-95](stores/app.ts#L90-L95)

```typescript
async loadCampaignById(campaignId: number) {
    const { data } = await useFetch<Campaign>(`/api/campaigns/${campaignId}`)
    if (data.value) {
        this.currentCampaign = this.normalizeCampaign(data.value)
    }
}
```

## Comment tester

### 1. Vérifier que les données sont initialisées

```bash
npm run db:init
```

Vérifiez dans Prisma Studio :
```bash
npm run db:studio
```

- ✅ Table `Scenario` : 95 entrées
- ✅ Table `Element` : 6 entrées

### 2. Créer une campagne avec joueurs

```typescript
POST /api/campaigns
{
  "companyName": "Test Game",
  "players": [
    { "name": "Player 1", "healthPointsMax": 10 },
    { "name": "Player 2", "healthPointsMax": 8 }
  ]
}
```

### 3. Charger la campagne

Naviguez vers `/campaigns` et sélectionnez votre campagne.

### 4. Sélectionner un scénario

Sur la page `/scenarios`, cliquez sur un scénario (par exemple Scénario 1).

### 5. Vérifier la page de jeu

Sur `/game`, vous devriez maintenant voir :

- ✅ **Image du scénario** en haut à gauche
- ✅ **Bouton Reset** sous l'image
- ✅ **Round Component** (Round 1 avec bouton +)
- ✅ **Elements Component** (6 éléments : Feu, Ténèbre, Terre, Vent, Lumière, Givre)
- ✅ **Deck de monstres** (avec image de carte)
- ✅ **Player Components** (cartes des joueurs avec HP/XP/Coins)

## Flux de données

```
1. API retourne Campaign avec campaignScenarios
   ↓
2. normalizeCampaign() extrait scenarios depuis campaignScenarios
   ↓
3. Le code frontend utilise campaign.scenarios comme avant
   ↓
4. loadScenario() trouve le scénario et son jeu associé
   ↓
5. currentGame est initialisé avec :
   - monsterDeck: Deck créé avec createDeck()
   - players: Joueurs avec HP actuels (initializePlayersForGame)
   - rounds: Array vide au départ
   ↓
6. La page game.vue affiche tous les composants
```

## Débogage

### Si les composants ne s'affichent toujours pas

1. **Vérifier dans la console** :

Ouvrez les DevTools (F12) et regardez la console pour des erreurs.

2. **Vérifier l'état du store** :

```javascript
// Dans la console du navigateur
console.log(useAppStore().currentCampaign)
console.log(useAppStore().currentGame)
console.log(useAppStore().currentScenario)
```

Vérifiez que :
- `currentCampaign` n'est pas `null`
- `currentCampaign.scenarios` existe et contient des scénarios
- `currentGame` n'est pas `null`
- `currentGame.players` existe et contient les joueurs
- `currentGame.monsterDeck` existe
- `currentGame.rounds` existe (peut être vide au début)

3. **Vérifier les composants** :

Dans `game.vue`, les composants sont conditionnels :

```vue
<!-- Deck s'affiche si monsterDeck existe -->
<DeckComponent
    v-if="appStore.currentGame?.monsterDeck"
    :deck-name="appStore.currentGame.monsterDeck.name"
/>

<!-- Players s'affichent si currentCampaign.players existe -->
<div v-if="appStore.currentCampaign && appStore.currentCampaign.players.length > 0">
    <div v-for="player in appStore.currentGame?.players">
        <PlayerComponent :player="player" />
    </div>
</div>

<!-- Round s'affiche si currentRound existe -->
<RoundComponent
    v-if="currentRound"
    :round="currentRound"
    @next-round="nextRound"
/>
```

4. **Forcer le rechargement** :

Parfois, le problème vient du cache. Essayez :
- Rechargez la page (F5)
- Videz le cache (Ctrl+Shift+Delete)
- Relancez le serveur dev (`npm run dev`)

## Améliorations futures

Pour éviter cette complexité de normalisation, vous pourriez :

1. **Option A** : Adapter tout le frontend pour utiliser directement `campaignScenarios`
2. **Option B** : Créer un endpoint API qui retourne directement le format attendu
3. **Option C** : Utiliser un transformer Pinia pour automatiser la normalisation

Pour l'instant, la solution actuelle avec `normalizeCampaign()` fonctionne et maintient la compatibilité. ✅

## Résumé

Le problème venait du fait que l'API retournait `campaignScenarios` mais le frontend s'attendait à `scenarios`. La solution a été d'ajouter une fonction de normalisation qui transforme les données au chargement, préservant ainsi la compatibilité avec le code existant tout en utilisant la nouvelle structure de base de données.

Les composants devraient maintenant tous s'afficher correctement lors du lancement d'une partie ! 🎮
