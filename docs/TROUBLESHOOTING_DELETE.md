# Dépannage : Erreur "deleteCampaign is not a function"

## Problème

Erreur rencontrée :
```
TypeError: appStore.deleteCampaign is not a function
```

## Cause probable

La méthode `deleteCampaign` existe bien dans le fichier `stores/app.ts` (ligne 164), mais l'application n'a pas rechargé le store correctement, probablement à cause d'un problème de cache ou de Hot Module Replacement (HMR).

## Solutions

### Solution 1 : Redémarrer le serveur de développement

1. Arrêter le serveur Nuxt (Ctrl+C dans le terminal)
2. Supprimer le cache :
   ```bash
   rm -rf .nuxt
   rm -rf node_modules/.cache
   ```
3. Redémarrer le serveur :
   ```bash
   npm run dev
   ```

### Solution 2 : Vider le cache du navigateur

1. Ouvrir les DevTools (F12)
2. Faire un clic droit sur le bouton de rafraîchissement
3. Sélectionner "Vider le cache et effectuer une actualisation forcée"

Ou utiliser le raccourci : **Ctrl + Shift + R** (ou Cmd + Shift + R sur Mac)

### Solution 3 : Vérifier que le fichier est bien enregistré

1. Ouvrir `stores/app.ts`
2. Chercher la ligne 164 : `async deleteCampaign(campaignId: number) {`
3. S'assurer que le fichier est bien sauvegardé (vérifier qu'il n'y a pas de point ou d'astérisque dans l'onglet de l'éditeur)

### Solution 4 : Forcer le rechargement du module

Ajouter temporairement un console.log dans le store pour forcer le rechargement :

```typescript
// stores/app.ts
export const useAppStore = defineStore('app', {
    state: () => ({
        elements: [] as Element[],
        // ... reste du code
    }),

    actions: {
        async initialize() {
            console.log('Store initialisé avec deleteCampaign:', typeof this.deleteCampaign)
            await this.loadElements()
            await this.generateScenarios()
        },
        // ... reste du code
    }
})
```

Puis vérifier dans la console du navigateur que le type est bien `function`.

## Vérification

Pour vérifier que la méthode est bien présente dans le store :

1. Ouvrir la console du navigateur (F12)
2. Exécuter :
   ```javascript
   const { useAppStore } = await import('/stores/app')
   const appStore = useAppStore()
   console.log('Type de deleteCampaign:', typeof appStore.deleteCampaign)
   console.log('Méthodes du store:', Object.keys(appStore).filter(k => typeof appStore[k] === 'function'))
   ```

Si `typeof appStore.deleteCampaign` retourne `"function"`, c'est que le problème vient du cache.

## Code de la méthode

La méthode `deleteCampaign` est située à la ligne 164 de `stores/app.ts` :

```typescript
async deleteCampaign(campaignId: number) {
    try {
        const { data, error } = await useFetch(`/api/campaigns/${campaignId}`, {
            method: 'DELETE'
        })

        if (error.value) {
            throw new Error(error.value.statusMessage || 'Erreur lors de la suppression de la campagne')
        }

        // Retirer la campagne de la liste locale
        const index = this.campaigns.findIndex(c => c.id === campaignId)
        if (index > -1) {
            this.campaigns.splice(index, 1)
        }

        // Si c'est la campagne courante, la réinitialiser
        if (this.currentCampaign?.id === campaignId) {
            this.currentCampaign = null
            this.currentScenario = null
            this.currentGame = null
        }

        return data.value
    } catch (error: any) {
        console.error('Erreur lors de la suppression:', error)
        throw error
    }
},
```

## Si le problème persiste

Si aucune des solutions ci-dessus ne fonctionne :

1. Vérifier qu'il n'y a pas d'erreur de syntaxe dans le fichier `stores/app.ts`
2. Vérifier que toutes les accolades sont bien fermées
3. Essayer de recréer le fichier depuis zéro
4. Vérifier les logs du serveur Nuxt pour voir s'il y a des erreurs de compilation
