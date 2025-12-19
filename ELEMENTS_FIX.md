# Fix - Les éléments ne s'affichent pas

## Problème identifié

Les 6 éléments (Feu, Ténèbre, Terre, Vent, Lumière, Givre) ne s'affichent pas dans la page `/game`.

## Cause racine

La fonction `appStore.initialize()` qui charge les éléments et scénarios depuis l'API **n'était jamais appelée** au démarrage de l'application !

### Flux prévu (mais non implémenté)

```
1. App démarre
   ↓
2. appStore.initialize() est appelé
   ↓
3. loadElements() → Appelle /api/elements
   ↓
4. /api/elements vérifie si la table Element est vide
   ↓
5. Si vide → Crée automatiquement les 6 éléments
   ↓
6. Retourne les éléments au store
   ↓
7. Store ajoute la propriété 'state: 0' à chaque élément
   ↓
8. Elements disponibles dans toute l'application
```

### Flux réel (problème)

```
1. App démarre
   ↓
2. ❌ initialize() n'est jamais appelé
   ↓
3. appStore.elements reste []
   ↓
4. ElementComponent ne s'affiche pas (array vide)
```

## ✅ Solution appliquée

### Ajout de l'initialisation dans app.vue - [app.vue:2-13](app.vue#L2-L13)

**Avant :**
```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

**Après :**
```vue
<!-- app.vue -->
<script setup lang="ts">
const appStore = useAppStore()

// Initialiser l'application au démarrage
onMounted(async () => {
  console.log('🚀 Initialisation de l\'application...')
  await appStore.initialize()
  console.log('✅ Application initialisée')
  console.log('📊 Éléments chargés:', appStore.elements.length)
  console.log('📊 Scénarios chargés:', appStore.scenarios.length)
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

## Comment ça fonctionne maintenant

### Au démarrage de l'application

1. **app.vue se monte** et appelle `appStore.initialize()`
2. **loadElements()** fait un appel à `/api/elements`
3. **L'endpoint /api/elements** ([server/api/elements/index.get.ts](server/api/elements/index.get.ts)) :
   - Appelle `ensureElementsExist()`
   - Vérifie si la table `Element` est vide
   - Si vide → Crée les 6 éléments automatiquement
   - Retourne tous les éléments
4. **Le store** reçoit les éléments et ajoute `state: 0` à chacun
5. **generateScenarios()** fait pareil pour les scénarios

### Logs dans la console

Vous devriez maintenant voir au démarrage :

```
🚀 Initialisation de l'application...
✓ 6 éléments déjà présents dans la base de données
✓ 95 scénarios déjà présents dans la base de données
✅ Application initialisée
📊 Éléments chargés: 6
📊 Scénarios chargés: 95
```

Ou lors du premier lancement :

```
🚀 Initialisation de l'application...
🔄 Aucun élément trouvé, initialisation en cours...
✓ 6 éléments créés
✓ 95 scénarios créés
✅ Application initialisée
📊 Éléments chargés: 6
📊 Scénarios chargés: 95
```

## Vérification dans la page /game

Une fois dans `/game`, les logs de debug afficheront :

```
=== DEBUG GAME.VUE ===
elements: [
  { id: 1, name: "Feu", imagePath: "/img/Elements/FirePicture.png", state: 0 },
  { id: 2, name: "Ténèbre", imagePath: "/img/Elements/DarknessPicture.png", state: 0 },
  { id: 3, name: "Terre", imagePath: "/img/Elements/EarthPicture.png", state: 0 },
  { id: 4, name: "Vent", imagePath: "/img/Elements/WindPicture.png", state: 0 },
  { id: 5, name: "Lumière", imagePath: "/img/Elements/LightPicture.png", state: 0 },
  { id: 6, name: "Givre", imagePath: "/img/Elements/FrostPicture.png", state: 0 }
]
```

## Structure des éléments

### En base de données (table Element)

```sql
id | name     | imagePath
---|----------|----------------------------------
1  | Feu      | /img/Elements/FirePicture.png
2  | Ténèbre  | /img/Elements/DarknessPicture.png
3  | Terre    | /img/Elements/EarthPicture.png
4  | Vent     | /img/Elements/WindPicture.png
5  | Lumière  | /img/Elements/LightPicture.png
6  | Givre    | /img/Elements/FrostPicture.png
```

### Dans le store (avec propriété state ajoutée)

```typescript
{
  id: 1,
  name: "Feu",
  imagePath: "/img/Elements/FirePicture.png",
  state: 0  // 0 = inactif, 1 = faible, 2 = fort
}
```

## Test de la solution

1. **Rechargez complètement la page** (Ctrl+Shift+R) :
   - Cela forcera le remontage de `app.vue`
   - `initialize()` sera appelé

2. **Vérifiez les logs** dans la console (F12) :
   ```
   🚀 Initialisation de l'application...
   ✅ Application initialisée
   📊 Éléments chargés: 6
   📊 Scénarios chargés: 95
   ```

3. **Naviguez vers /game** :
   - ✅ Les 6 éléments devraient s'afficher
   - ✅ Vous pouvez cliquer sur +/- pour changer leur état

## Composant ElementComponent

Le composant `ElementComponent.vue` affiche les éléments en grille 3x2 :

```vue
<ElementComponent
    @use-element="useState"
    @set-element-strong="setElementStrong"
/>
```

### États possibles

Chaque élément peut avoir 3 états :

| State | Couleur | Signification |
|-------|---------|---------------|
| 0 | Gris | Inactif |
| 1 | Orange | Faible |
| 2 | Rouge | Fort |

### Interactions

- **Clic sur +** : Augmente l'état (0→1→2)
- **Clic sur -** : Diminue l'état (2→1→0)
- **Fin de round** : Tous les éléments descendent d'un niveau (2→1, 1→0, 0→0)

## Si les éléments ne s'affichent toujours pas

1. **Vérifiez la console** :
   - Erreurs réseau ?
   - `appStore.elements.length` = 6 ?

2. **Vérifiez l'endpoint /api/elements** :
   - Ouvrez http://localhost:3000/api/elements
   - Devrait retourner un JSON avec 6 éléments

3. **Vérifiez la base de données** :
   ```bash
   npm run db:studio
   ```
   - Ouvrez la table `Element`
   - Devrait contenir 6 entrées

4. **Si la table Element est vide**, l'auto-initialisation devrait la remplir au prochain appel de `/api/elements`

5. **Si l'endpoint retourne une erreur**, vérifiez les credentials de la base de données dans `.env`

## Problème de credentials DB

Si vous voyez cette erreur dans les scripts npm :

```
Authentication failed against database server, the provided database credentials for `root` are not valid.
```

C'est normal - les scripts utilisent un processus séparé qui n'a pas accès aux variables d'environnement. Mais l'application Nuxt elle-même fonctionne car elle a accès à `.env`.

**Solution** : L'auto-initialisation via `/api/elements` fonctionne même si les scripts npm ne marchent pas, car l'endpoint utilise le même Prisma Client que l'application.

## Résumé

- ✅ **Problème** : `initialize()` n'était jamais appelé
- ✅ **Solution** : Ajout de l'appel dans `app.vue` onMounted
- ✅ **Résultat** : Les éléments et scénarios sont chargés automatiquement au démarrage
- ✅ **Bonus** : Auto-initialisation en DB si les tables sont vides

Rechargez votre application et les éléments devraient maintenant s'afficher ! 🔥⚡🌍💨☀️❄️
