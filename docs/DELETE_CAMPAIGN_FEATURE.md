# Fonctionnalité : Suppression de Campagne

## Vue d'ensemble

Cette fonctionnalité permet de supprimer définitivement une campagne avec confirmation préalable.

**Sécurité** : Un modal de confirmation s'affiche avant toute suppression pour éviter les suppressions accidentelles.

## Fichiers créés/modifiés

### API Backend

#### `server/api/campaigns/[id].delete.ts`
Endpoint DELETE pour supprimer une campagne.

**Fonctionnalités** :
- Validation de l'ID de la campagne
- Vérification que la campagne existe
- Suppression en cascade :
  - La campagne
  - Tous les joueurs associés
  - Tous les CampaignScenarios
  - Toutes les relations (grâce aux `onDelete: Cascade` du schema Prisma)
- Retourne un statut de succès

**Exemple de requête** :
```typescript
DELETE /api/campaigns/1
```

**Réponse** :
```json
{
  "success": true,
  "message": "Campagne supprimée avec succès",
  "deletedId": 1
}
```

### Store Pinia

#### `stores/app.ts` - Méthode `deleteCampaign()`

**Signature** :
```typescript
async deleteCampaign(campaignId: number): Promise<any>
```

**Fonctionnalités** :
- Appelle l'API DELETE
- Retire la campagne de la liste locale
- Si c'est la campagne courante :
  - Réinitialise `currentCampaign`
  - Réinitialise `currentScenario`
  - Réinitialise `currentGame`
- Gestion des erreurs

### Composants Vue

#### `components/ConfirmDeleteModal.vue`
Modal de confirmation de suppression.

**Props** :
- `show: boolean` - Contrôle l'affichage du modal
- `campaignName: string` - Nom de la campagne à supprimer

**Events** :
- `confirm()` - L'utilisateur confirme la suppression
- `cancel()` - L'utilisateur annule

**Fonctionnalités** :
- Design avec couleurs d'alerte (rouge)
- Animation de tremblement au chargement
- Icône d'alerte ⚠️
- Affichage du nom de la campagne en surbrillance
- Message d'avertissement sur l'irréversibilité
- Boutons "Annuler" et "Supprimer"
- Fermeture en cliquant à l'extérieur (annulation)

#### `pages/campaigns.vue`
Page mise à jour avec la fonctionnalité de suppression.

**Nouvelles variables** :
- `showDeleteModal` - Contrôle l'affichage du modal de confirmation
- `campaignToDelete` - Référence à la campagne à supprimer

**Nouvelles fonctions** :
- `openDeleteDialog(campaign)` - Ouvre le modal de confirmation
- `closeDeleteDialog()` - Ferme le modal sans supprimer
- `confirmDelete()` - Supprime la campagne après confirmation

**Nouveau bouton** :
- "🗑️ Supprimer" pour chaque campagne

## Utilisation

### Pour l'utilisateur

1. Aller sur la page "Charger une campagne" (`/campaigns`)
2. Cliquer sur le bouton "🗑️ Supprimer" d'une campagne
3. Un modal de confirmation s'affiche avec :
   - Le nom de la campagne
   - Un avertissement sur l'irréversibilité
4. Options :
   - Cliquer sur "Supprimer" pour confirmer
   - Cliquer sur "Annuler" pour fermer sans supprimer
   - Cliquer en dehors du modal pour annuler

### Comportement après suppression

- La campagne disparaît immédiatement de la liste
- Si c'était la campagne en cours de jeu :
  - L'utilisateur est ramené à l'écran d'accueil
  - Aucun scénario n'est chargé
- Aucune possibilité de récupération (suppression définitive)

## Éléments supprimés en cascade

Lorsqu'une campagne est supprimée, les éléments suivants sont automatiquement supprimés grâce au `onDelete: Cascade` défini dans le schema Prisma :

1. **Players** - Tous les joueurs de la campagne
2. **CampaignScenarios** - Toutes les associations campagne-scénario
3. **Effects** - Tous les effets des joueurs (via Player)
4. **PlayerGames** - Toutes les participations des joueurs aux jeux (via Player)
5. **Decks** - Les decks des joueurs (via Player)
6. **Cards** - Toutes les cartes des decks (via Deck)

**Note** : Les scénarios globaux (table `Scenario`) ne sont PAS supprimés, car ils sont partagés entre toutes les campagnes.

## Sécurité et validations

1. **Confirmation obligatoire** : Impossible de supprimer sans passer par le modal
2. **Vérification d'existence** : L'API vérifie que la campagne existe avant suppression
3. **Message clair** : L'utilisateur voit exactement ce qu'il va supprimer
4. **Avertissement** : Message explicite sur l'irréversibilité
5. **Animation visuelle** : Le modal tremble pour attirer l'attention
6. **Couleurs d'alerte** : Rouge pour signaler le danger

## Tests suggérés

1. **Suppression normale**
   - Cliquer sur "Supprimer"
   - Confirmer dans le modal
   - Vérifier que la campagne disparaît

2. **Annulation**
   - Cliquer sur "Supprimer"
   - Cliquer sur "Annuler"
   - Vérifier que la campagne reste

3. **Fermeture par clic extérieur**
   - Cliquer sur "Supprimer"
   - Cliquer en dehors du modal
   - Vérifier que la campagne reste

4. **Suppression de la campagne courante**
   - Charger une campagne et commencer à jouer
   - Retourner à la liste et supprimer cette campagne
   - Vérifier que l'état du jeu est réinitialisé

5. **Suppression en base de données**
   - Supprimer une campagne
   - Vérifier avec Prisma Studio que :
     - La campagne est supprimée
     - Les joueurs sont supprimés
     - Les relations sont supprimées

6. **Gestion d'erreurs**
   - Tenter de supprimer une campagne déjà supprimée
   - Vérifier que l'erreur est gérée gracieusement

## Notes techniques

### Cascade Prisma

Le schema Prisma utilise `onDelete: Cascade` pour automatiser la suppression :

```prisma
model Player {
  campaignId Int
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}
```

Cela signifie que lorsqu'une `Campaign` est supprimée, tous les `Player` liés sont automatiquement supprimés, sans code supplémentaire nécessaire.

### État réactif

La suppression met à jour immédiatement l'état du store Pinia, ce qui provoque une mise à jour automatique de l'interface grâce à la réactivité de Vue 3.

### Gestion des erreurs

- Si la suppression échoue côté API, une erreur est lancée
- Le store capture l'erreur et l'affiche via `alert()`
- Le modal reste ouvert en cas d'erreur pour permettre un nouvel essai

## Améliorations futures possibles

1. **Toast notifications** : Remplacer les `alert()` par des notifications toast plus élégantes
2. **Corbeille** : Implémenter une suppression logique (soft delete) avec possibilité de récupération
3. **Archivage** : Proposer d'archiver plutôt que de supprimer
4. **Export avant suppression** : Proposer d'exporter les données avant suppression
5. **Confirmation par saisie** : Pour les campagnes avec beaucoup de données, demander de taper le nom de la campagne pour confirmer
6. **Historique** : Garder une trace des suppressions pour audit
7. **Permissions** : Ajouter un système de permissions (ex: seul le créateur peut supprimer)
