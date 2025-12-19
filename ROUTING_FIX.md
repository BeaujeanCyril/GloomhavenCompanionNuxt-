# Fix - Erreur Vue Router "No match found for /api/campaigns/1"

## Problème

```
WARN [Vue Router warn]: No match found for location with path "/api/campaigns/1"
```

## Cause

Cette erreur survient lorsque Vue Router essaie d'interpréter un appel API comme une route Vue. Le problème venait de **fichiers API en double** dans le dossier `server/api/`.

### Structure problématique

```
server/api/
├── [id]/                         ❌ Dossier en doublon (vide/inutilisé)
│   ├── scenarios.ts
│   └── [scenarioId].get.ts
├── [id].get.ts                   ❌ Doublon de campaigns/[id].get.ts
├── [id].put.ts                   ❌ Fichier vide
├── index.get.ts                  ❌ Doublon de campaigns.get.ts
├── index.post.ts                 ❌ Doublon de campaigns/index.post.ts
├── campaigns/
│   ├── [id].get.ts              ✅ Bon fichier (avec campaignScenarios)
│   └── index.post.ts            ✅ Bon fichier
├── campaigns.get.ts              ✅ Bon fichier
├── elements/
│   └── index.get.ts              ✅ Bon fichier
└── scenarios/
    └── index.get.ts              ✅ Bon fichier
```

### Pourquoi c'était un problème ?

1. **Conflit de routes** : `server/api/[id].get.ts` créait une route `/api/:id` qui interceptait tous les appels à `/api/campaigns/1`
2. **Ancienne structure** : Les fichiers en double utilisaient l'ancienne structure avec `scenarios` au lieu de `campaignScenarios`
3. **Vue Router confusion** : Vue Router essayait de matcher ces URLs comme des routes frontend

## ✅ Solution appliquée

### Fichiers supprimés

```bash
# Fichiers en double supprimés
server/api/[id].get.ts          # Doublon incorrect
server/api/[id].put.ts          # Fichier vide
server/api/index.get.ts         # Doublon de campaigns.get.ts
server/api/index.post.ts        # Doublon de campaigns/index.post.ts
server/api/[id]/                # Dossier entier (vide/inutilisé)
```

### Structure correcte finale

```
server/api/
├── campaigns/
│   ├── [id].get.ts              ✅ GET /api/campaigns/:id
│   └── index.post.ts            ✅ POST /api/campaigns
├── campaigns.get.ts              ✅ GET /api/campaigns
├── elements/
│   └── index.get.ts              ✅ GET /api/elements
└── scenarios/
    └── index.get.ts              ✅ GET /api/scenarios
```

## Routes API disponibles

| Endpoint | Fichier | Méthode |
|----------|---------|---------|
| `/api/campaigns` | `campaigns.get.ts` | GET |
| `/api/campaigns` | `campaigns/index.post.ts` | POST |
| `/api/campaigns/:id` | `campaigns/[id].get.ts` | GET |
| `/api/scenarios` | `scenarios/index.get.ts` | GET |
| `/api/elements` | `elements/index.get.ts` | GET |

## Test de la solution

1. **Rechargez le serveur Nuxt** :
   ```bash
   # Arrêtez le serveur (Ctrl+C)
   npm run dev
   ```

2. **Vérifiez qu'il n'y a plus de warning** dans la console IDE

3. **Testez les endpoints** :
   - `http://localhost:3000/api/campaigns`
   - `http://localhost:3000/api/campaigns/1`
   - `http://localhost:3000/api/scenarios`
   - `http://localhost:3000/api/elements`

## Explications techniques

### Routing dans Nuxt 3 Nitro

Nuxt 3 utilise Nitro pour le routing des API. Le routing est file-based :

| Fichier | Route générée |
|---------|---------------|
| `server/api/campaigns.get.ts` | `GET /api/campaigns` |
| `server/api/campaigns/[id].get.ts` | `GET /api/campaigns/:id` |
| `server/api/[id].get.ts` | `GET /api/:id` ⚠️ TROP GÉNÉRAL |

### Le problème avec `[id].get.ts`

```typescript
// ❌ server/api/[id].get.ts
// Crée la route : GET /api/:id
// Intercepte TOUS les appels comme :
// - /api/campaigns/1 → Matche [id] au lieu de campaigns/[id]
// - /api/scenarios/5 → Matche [id] au lieu de scenarios/[id]
// - /api/anything/123 → Matche [id]
```

C'est comme avoir un `catch-all` qui intercepte toutes les routes !

### La solution correcte

```typescript
// ✅ server/api/campaigns/[id].get.ts
// Crée la route : GET /api/campaigns/:id
// Intercepte UNIQUEMENT :
// - /api/campaigns/1
// - /api/campaigns/2
// - etc.
```

Les routes sont maintenant spécifiques et ne créent plus de conflits.

## Vérification dans le code

### Avant (avec doublons)

```typescript
// ❌ server/api/[id].get.ts (SUPPRIMÉ)
export default defineEventHandler(async (event) => {
    const params = getRouterParams(event)
    const id = Number(params.id)

    const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
            players: true,
            scenarios: true  // ❌ Ancienne structure
        }
    })

    return campaign
})
```

### Après (fichier correct)

```typescript
// ✅ server/api/campaigns/[id].get.ts (CONSERVÉ)
export default defineEventHandler(async (event) => {
    const params = getRouterParams(event)
    const id = Number(params.id)

    const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
            players: true,
            campaignScenarios: {  // ✅ Nouvelle structure
                include: {
                    scenario: true
                }
            }
        }
    })

    return campaign
})
```

## Autres warnings possibles

Si vous voyez d'autres warnings similaires, vérifiez :

1. **Pas de fichiers en double** dans `server/api/`
2. **Routes bien organisées** par dossier
3. **Pas de routes trop générales** comme `[id].get.ts` à la racine

## Bonne pratique

### ✅ Organisation recommandée

```
server/api/
├── campaigns/           # Groupe "campaigns"
│   ├── [id].get.ts     # GET /api/campaigns/:id
│   ├── [id].put.ts     # PUT /api/campaigns/:id
│   └── index.post.ts   # POST /api/campaigns
├── campaigns.get.ts     # GET /api/campaigns (liste)
├── scenarios/           # Groupe "scenarios"
│   └── index.get.ts    # GET /api/scenarios
└── elements/            # Groupe "elements"
    └── index.get.ts    # GET /api/elements
```

### ❌ À éviter

```
server/api/
├── [id].get.ts         # ❌ Trop général !
├── [id].put.ts         # ❌ Trop général !
└── [id]/               # ❌ Confus et ambigu
    └── [scenarioId].get.ts
```

## Résumé

- ✅ **Problème** : Fichiers API en double créant des conflits de routes
- ✅ **Solution** : Suppression des doublons et organisation claire
- ✅ **Résultat** : Plus de warning Vue Router, routes API fonctionnent correctement

Le warning devrait maintenant avoir disparu ! 🎉
