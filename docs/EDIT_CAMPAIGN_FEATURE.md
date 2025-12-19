# Fonctionnalité : Modification de Campagne

## Vue d'ensemble

Cette fonctionnalité permet de modifier une campagne existante, incluant :
- Le nom de la campagne
- Les joueurs (nom, points de vie max, or, XP)
- Ajout/suppression de joueurs

## Fichiers modifiés/créés

### API Backend

#### `server/api/campaigns/[id].put.ts`
Endpoint PUT pour mettre à jour une campagne.

**Fonctionnalités** :
- Validation des données entrantes
- Mise à jour du nom de la campagne
- Gestion des joueurs :
  - Mise à jour des joueurs existants
  - Ajout de nouveaux joueurs
  - Suppression des joueurs retirés
- Utilise une transaction Prisma pour garantir la cohérence
- Retourne la campagne complète avec toutes les relations

**Exemple de requête** :
```typescript
PUT /api/campaigns/1
{
  "companyName": "Les Mercenaires de Gloomhaven",
  "players": [
    {
      "id": 1,
      "name": "Aragorn",
      "healthPointsMax": 12,
      "coins": 50,
      "xp": 100
    },
    {
      "name": "Legolas", // Nouveau joueur sans ID
      "healthPointsMax": 10,
      "coins": 30,
      "xp": 80
    }
  ]
}
```

### Store Pinia

#### `stores/app.ts`
Méthode `updateCampaign()` mise à jour.

**Signature** :
```typescript
async updateCampaign(
  campaignId: number,
  updatedData: { companyName: string, players: Player[] }
): Promise<Campaign | undefined>
```

**Fonctionnalités** :
- Appelle l'API PUT
- Met à jour la liste locale des campagnes
- Met à jour la campagne courante si nécessaire
- Normalise les données pour compatibilité

### Composants Vue

#### `components/EditCampaignModal.vue`
Modal de modification de campagne.

**Props** :
- `campaign: Campaign` - La campagne à modifier
- `show: boolean` - Contrôle l'affichage du modal

**Events** :
- `close()` - Fermeture sans sauvegarde
- `save(data)` - Sauvegarde avec les données modifiées

**Fonctionnalités** :
- Formulaire réactif avec validation
- Modification du nom de campagne
- Liste éditable des joueurs avec :
  - Modification du nom
  - Modification des points de vie max
  - Modification de l'or
  - Modification de l'XP
  - Bouton "Ajouter un joueur"
  - Bouton "Supprimer" par joueur
- Design responsive
- Transitions fluides

#### `pages/campaigns.vue`
Page de liste des campagnes mise à jour.

**Fonctionnalités ajoutées** :
- Bouton "Éditer" pour chaque campagne
- Gestion du modal d'édition
- Handler `handleSaveCampaign()` pour sauvegarder les modifications
- Rechargement automatique des campagnes après sauvegarde

## Utilisation

### Pour l'utilisateur

1. Aller sur la page "Charger une campagne" (`/campaigns`)
2. Cliquer sur le bouton "✏️ Éditer" d'une campagne
3. Modifier :
   - Le nom de la campagne
   - Les informations de chaque joueur (nom, PV max, or, XP)
   - Ajouter de nouveaux joueurs avec le bouton "+ Ajouter un joueur"
   - Supprimer des joueurs avec le bouton "Supprimer"
4. Cliquer sur "Enregistrer" pour sauvegarder
5. Ou "Annuler" pour fermer sans sauvegarder

### Validations

- Le nom de la campagne est requis
- Au moins un joueur est requis
- Le nom de chaque joueur est requis
- Les points de vie doivent être > 0
- L'or et l'XP doivent être ≥ 0

## Tests suggérés

1. **Modifier le nom d'une campagne**
   - Ouvrir une campagne
   - Modifier le nom
   - Enregistrer
   - Vérifier que le nouveau nom s'affiche

2. **Modifier un joueur existant**
   - Ouvrir une campagne avec des joueurs
   - Modifier nom/PV/or/XP d'un joueur
   - Enregistrer
   - Vérifier les modifications

3. **Ajouter un nouveau joueur**
   - Cliquer sur "+ Ajouter un joueur"
   - Remplir les informations
   - Enregistrer
   - Vérifier qu'il apparaît dans la liste

4. **Supprimer un joueur**
   - Cliquer sur "Supprimer" d'un joueur
   - Enregistrer
   - Vérifier qu'il a disparu

5. **Annulation**
   - Faire des modifications
   - Cliquer sur "Annuler"
   - Vérifier qu'aucune modification n'est sauvegardée

6. **Validation**
   - Essayer de sauvegarder sans nom de campagne
   - Essayer de supprimer tous les joueurs
   - Essayer de sauvegarder avec un joueur sans nom
   - Vérifier que les messages d'erreur s'affichent

## Notes techniques

### Transaction Prisma
L'endpoint utilise `prisma.$transaction()` pour garantir que toutes les opérations (mise à jour campagne, création/modification/suppression joueurs) sont atomiques. Si une opération échoue, tout est annulé.

### Deep Copy
Le composant modal fait une copie profonde des données de la campagne pour éviter de modifier directement l'état du store pendant l'édition.

### Normalisation
Les données retournées par l'API sont normalisées par le store pour maintenir la compatibilité avec l'ancienne structure (transformation de `campaignScenarios` en `scenarios`).

## Améliorations futures possibles

1. Confirmation avant suppression d'un joueur
2. Annulation avec confirmation si des modifications ont été faites
3. Sauvegarde automatique (brouillon)
4. Historique des modifications
5. Validation en temps réel avec messages d'erreur sous chaque champ
6. Drag & drop pour réorganiser les joueurs
7. Import/export de joueurs
