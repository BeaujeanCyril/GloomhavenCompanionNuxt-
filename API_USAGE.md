# Documentation API - Gloomhaven Companion

## Vue d'ensemble

L'API Gloomhaven Companion fournit des endpoints pour gérer les campagnes, joueurs, scénarios et éléments. Les données de base (scénarios et éléments) sont automatiquement initialisées au premier lancement.

## Initialisation automatique

Au premier appel aux endpoints `/api/scenarios` ou `/api/elements`, le système vérifie automatiquement si les tables sont vides et les initialise si nécessaire :

- **Scénarios** : 95 scénarios créés automatiquement (ou basés sur les images du dossier `public/img/Scenarios/`)
- **Éléments** : 6 éléments créés automatiquement (Feu, Ténèbre, Terre, Vent, Lumière, Givre)

## Création d'une campagne avec joueurs

L'API permet de créer une campagne et d'y intégrer directement les joueurs en une seule requête.

### Endpoint

**POST** `/api/campaigns`

### Format de la requête

```typescript
{
  companyName: string,
  players?: Array<{
    name: string,
    healthPointsMax: number,
    coins?: number,
    xp?: number
  }>
}
```

### Exemples d'utilisation

#### 1. Créer une campagne sans joueurs

```typescript
const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyName: 'Les Aventuriers du Nord'
  })
})

const campaign = await response.json()
```

#### 2. Créer une campagne avec plusieurs joueurs

```typescript
const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    companyName: 'Les Héros de Gloomhaven',
    players: [
      {
        name: 'Aragorn',
        healthPointsMax: 10,
        coins: 30,
        xp: 0
      },
      {
        name: 'Legolas',
        healthPointsMax: 8,
        coins: 20,
        xp: 5
      },
      {
        name: 'Gimli',
        healthPointsMax: 12,
        coins: 15
      }
    ]
  })
})

const campaign = await response.json()
```

#### 3. Utiliser le store Pinia

```typescript
import { useAppStore } from '~/stores/app'

const store = useAppStore()

// Créer une campagne avec joueurs
await store.addCampaign({
  companyName: 'Ma Nouvelle Campagne',
  players: [
    {
      name: 'Joueur 1',
      healthPointsMax: 10,
      coins: 30,
      xp: 0
    },
    {
      name: 'Joueur 2',
      healthPointsMax: 8,
      coins: 25,
      xp: 10
    }
  ]
})
```

### Réponse

La réponse inclut la campagne créée avec tous les joueurs et leurs IDs générés :

```json
{
  "id": 1,
  "companyName": "Les Héros de Gloomhaven",
  "createdAt": "2025-11-16T10:30:00.000Z",
  "updatedAt": "2025-11-16T10:30:00.000Z",
  "players": [
    {
      "id": 1,
      "name": "Aragorn",
      "healthPointsMax": 10,
      "coins": 30,
      "xp": 0,
      "campaignId": 1
    },
    {
      "id": 2,
      "name": "Legolas",
      "healthPointsMax": 8,
      "coins": 20,
      "xp": 5,
      "campaignId": 1
    },
    {
      "id": 3,
      "name": "Gimli",
      "healthPointsMax": 12,
      "coins": 15,
      "xp": 0,
      "campaignId": 1
    }
  ],
  "scenarios": []
}
```

### Validation

L'API valide automatiquement les données :

- **companyName** : obligatoire, ne peut pas être vide
- **players.name** : obligatoire pour chaque joueur, ne peut pas être vide
- **players.healthPointsMax** : obligatoire pour chaque joueur, doit être > 0
- **players.coins** : optionnel, par défaut 0
- **players.xp** : optionnel, par défaut 0

### Codes d'erreur

- **400 Bad Request** : Données invalides (nom manquant, points de vie invalides, etc.)
- **500 Internal Server Error** : Erreur serveur lors de la création

### Exemples d'erreurs

```json
{
  "statusCode": 400,
  "statusMessage": "Le nom de la compagnie est requis"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "Le nom du joueur est requis"
}
```

```json
{
  "statusCode": 400,
  "statusMessage": "Les points de vie maximum doivent être supérieurs à 0"
}
```

## Récupérer les scénarios

### Endpoint

**GET** `/api/scenarios`

### Description

Récupère la liste de tous les scénarios disponibles. Si la table est vide au premier appel, les scénarios sont automatiquement créés.

### Réponse

```json
[
  {
    "id": 1,
    "name": "Scénario 1",
    "imagePath": "/img/Scenarios/gh-1.png"
  },
  {
    "id": 2,
    "name": "Scénario 2",
    "imagePath": "/img/Scenarios/gh-2.png"
  }
]
```

### Exemple d'utilisation

```typescript
const { data } = await useFetch('/api/scenarios')
console.log(data.value) // Liste de tous les scénarios
```

## Récupérer les éléments

### Endpoint

**GET** `/api/elements`

### Description

Récupère la liste de tous les éléments du jeu. Si la table est vide au premier appel, les 6 éléments sont automatiquement créés.

### Réponse

```json
[
  {
    "id": 1,
    "name": "Feu",
    "imagePath": "/img/Elements/FirePicture.png"
  },
  {
    "id": 2,
    "name": "Ténèbre",
    "imagePath": "/img/Elements/DarknessPicture.png"
  }
]
```

### Exemple d'utilisation

```typescript
const { data } = await useFetch('/api/elements')
console.log(data.value) // Liste de tous les éléments
```

**Note** : Le store Pinia ajoute automatiquement la propriété `state: 0` à chaque élément pour gérer l'état côté client.
