# Fix - Les composants ne s'affichent pas dans game.vue

## Problème identifié

Les composants (Deck, Players, Rounds, Elements) sont bien présents dans le dossier `components/` et sont utilisés dans `game.vue`, mais ils ne s'affichent pas à l'écran.

## Causes possibles

### 1. `currentGame` n'est pas initialisé

Quand vous chargez un scénario, le store devrait créer `currentGame` avec :
- `monsterDeck`: Deck de 20 cartes
- `players`: Joueurs avec HP actuels
- `rounds`: Array de rounds (commence vide)

### 2. Incohérence dans la condition v-if

Dans `game.vue` ligne 195-200 :

```vue
<!-- ❌ PROBLÈME: vérifie currentCampaign.players mais boucle sur currentGame.players -->
<div v-if="appStore.currentCampaign && appStore.currentCampaign.players.length > 0">
  <div v-for="player in appStore.currentGame?.players">
    <PlayerComponent :player="player" />
  </div>
</div>
```

La condition vérifie si `currentCampaign.players` existe, mais la boucle utilise `currentGame.players`. Si `currentGame` n'est pas initialisé, aucun joueur ne s'affiche !

### 3. `currentGame.players` vs `currentCampaign.players`

- `currentCampaign.players` = Joueurs de la campagne (HP max, stats globales)
- `currentGame.players` = Joueurs dans la partie en cours (HP actuels, stats de jeu)

## Solutions

### Solution 1 : Vérifier l'initialisation du jeu

Assurez-vous que `loadScenario()` est bien appelé avant d'afficher `game.vue`.

**Flux normal :**
```
1. Charger une campagne (loadCampaignById)
2. Naviguer vers /scenarios
3. Cliquer sur un scénario → appelle loadScenario(scenarioId)
4. Naviguer vers /game
5. game.vue s'affiche avec tous les composants
```

**Vérification dans le store ([stores/app.ts:179-216](stores/app.ts#L179-L216)) :**

```typescript
async loadScenario(scenarioId: number) {
    if (!this.currentCampaign) return

    let scenario = this.currentCampaign.scenarios?.find(s => s.id === scenarioId)

    // ... code pour charger le scénario ...

    this.currentScenario = scenario
    this.resetElements()

    if (scenario.game) {
        // ✅ Jeu existant
        this.currentGame = scenario.game
    } else {
        // ✅ Nouveau jeu
        const { initializePlayersForGame } = useGame()

        this.currentGame = {
            monsterDeck: this.createDeck('MonsterDeck'),
            players: initializePlayersForGame(this.currentCampaign.players),
            rounds: []
        }

        scenario.game = this.currentGame
    }
}
```

### Solution 2 : Corriger la condition dans game.vue

Remplacez ligne 195 dans `game.vue` :

**Avant (incorrect) :**
```vue
<div v-if="appStore.currentCampaign && appStore.currentCampaign.players.length > 0">
  <div v-for="player in appStore.currentGame?.players">
```

**Après (correct) :**
```vue
<div v-if="appStore.currentGame && appStore.currentGame.players && appStore.currentGame.players.length > 0">
  <div v-for="player in appStore.currentGame.players">
```

### Solution 3 : Ajouter des logs de debug

Ajoutez temporairement dans `game.vue` :

```vue
<script setup lang="ts">
const appStore = useAppStore()

// Debug
onMounted(() => {
  console.log('=== DEBUG GAME.VUE ===')
  console.log('currentCampaign:', appStore.currentCampaign)
  console.log('currentScenario:', appStore.currentScenario)
  console.log('currentGame:', appStore.currentGame)
  console.log('currentGame.players:', appStore.currentGame?.players)
  console.log('currentGame.monsterDeck:', appStore.currentGame?.monsterDeck)
  console.log('currentGame.rounds:', appStore.currentGame?.rounds)
  console.log('elements:', appStore.elements)
})
</script>
```

Ouvrez la console (F12) et vérifiez :

1. ✅ `currentCampaign` n'est pas `null`
2. ✅ `currentScenario` n'est pas `null`
3. ✅ `currentGame` n'est pas `null` ou `undefined`
4. ✅ `currentGame.players` est un array avec des joueurs
5. ✅ `currentGame.monsterDeck` existe
6. ✅ `currentGame.rounds` est un array (peut être vide)
7. ✅ `elements` contient 6 éléments

### Solution 4 : Vérifier que la campagne est bien normalisée

Après avoir chargé la campagne, vérifiez qu'elle a bien la propriété `scenarios` :

```typescript
// Dans la console
const store = useAppStore()
console.log(store.currentCampaign?.scenarios)
// Devrait afficher un array de scénarios
```

Si `scenarios` est `undefined` ou `[]`, le problème vient de la normalisation.

## Checklist de débogage

- [ ] 1. Vérifier que `npm run db:init` a été exécuté (scénarios et éléments en DB)
- [ ] 2. Vérifier que le client Prisma est à jour (`npx prisma generate`)
- [ ] 3. Créer une campagne avec joueurs
- [ ] 4. Charger la campagne (vérifier que `currentCampaign` existe)
- [ ] 5. Vérifier dans la console que `currentCampaign.scenarios` existe
- [ ] 6. Cliquer sur un scénario dans `/scenarios`
- [ ] 7. Vérifier dans la console que `loadScenario` a été appelé
- [ ] 8. Vérifier que `currentGame` existe et contient `players`, `monsterDeck`, `rounds`
- [ ] 9. Naviguer vers `/game`
- [ ] 10. Vérifier que les composants s'affichent

## Si currentGame est null ou undefined

Cela signifie que `loadScenario()` n'a pas été appelé. Vérifiez dans `pages/scenarios.vue` :

```vue
<!-- pages/scenarios.vue -->
<script setup lang="ts">
const appStore = useAppStore()

const navigateToGame = async (scenarioId: number) => {
  // ✅ Cette fonction doit être appelée au clic sur un scénario
  await appStore.loadScenario(scenarioId)
  navigateTo('/game')
}
</script>
```

## Si currentGame.players est vide

Vérifiez la fonction `initializePlayersForGame` dans `composables/useGame.ts` :

```typescript
const initializePlayersForGame = (players: Player[]): PlayerGame[] => {
  return players.map(player => ({
    ...player,
    healthPoints: player.healthPointsMax  // ✅ HP actuels = HP max au départ
  }))
}
```

## Résumé des composants attendus

Sur la page `/game`, vous devriez voir :

| Composant | Emplacement | Condition d'affichage |
|-----------|-------------|----------------------|
| **Image du scénario** | Haut gauche | `currentScenario?.imagePath` |
| **Bouton Reset** | Sous l'image | Toujours |
| **RoundComponent** | Haut gauche (bas) | `currentRound` existe |
| **ElementComponent** | Centre haut | `elements.length > 0` |
| **DeckComponent** | Droite | `currentGame?.monsterDeck` existe |
| **PlayerComponent** (x4) | Bas | `currentGame?.players.length > 0` |

## Code complet du fix

Voici le code corrigé pour la section Players dans `game.vue` :

```vue
<!-- Section Joueurs -->
<div
    v-if="appStore.currentGame && appStore.currentGame.players && appStore.currentGame.players.length > 0"
    class="mt-4">
  <div class="bg-gradient-to-r from-slate-700/90 to-slate-600/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-white/10">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
          v-for="player in appStore.currentGame.players"
          :key="player.id"
          class="transition-transform hover:-translate-y-1">
        <PlayerComponent :player="player" />
      </div>
    </div>
  </div>
</div>
```

## Test complet

1. **Créer une campagne** :
```json
POST /api/campaigns
{
  "companyName": "Test",
  "players": [
    { "name": "Player 1", "healthPointsMax": 10 },
    { "name": "Player 2", "healthPointsMax": 8 }
  ]
}
```

2. **Charger la campagne** :
- Aller sur `/campaigns`
- Cliquer sur "Test"

3. **Sélectionner un scénario** :
- Vous êtes redirigé vers `/scenarios`
- Cliquer sur "Scénario 1"

4. **Vérifier le jeu** :
- Vous êtes redirigé vers `/game`
- ✅ Voir l'image du scénario
- ✅ Voir le deck de monstres
- ✅ Voir les 2 cartes de joueurs
- ✅ Voir les 6 éléments
- ✅ Voir le round (0 au début)

Si tout fonctionne, les composants devraient tous s'afficher ! 🎮
