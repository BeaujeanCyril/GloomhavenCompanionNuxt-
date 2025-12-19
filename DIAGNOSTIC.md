# Diagnostic - Les éléments ne se chargent pas dans le store

## Symptômes

- Le store ne contient pas la liste des éléments
- `appStore.elements` est vide `[]`
- Les éléments ne s'affichent pas dans `/game`

## Points de vérification

### 1. Vérifier que l'endpoint /api/elements fonctionne

**Dans votre navigateur**, ouvrez : `http://localhost:3000/api/elements`

#### ✅ Résultat attendu

Vous devriez voir un JSON avec 6 éléments :

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
  },
  ...
]
```

#### ❌ Si vous voyez une erreur

**Erreur de connexion DB** :
```json
{
  "statusCode": 500,
  "message": "Authentication failed..."
}
```
→ Problème de credentials dans `.env`

**Erreur 404** :
```json
{
  "statusCode": 404,
  "message": "Not found"
}
```
→ L'endpoint n'existe pas ou n'est pas accessible

**Array vide** :
```json
[]
```
→ La table Element est vide ET l'auto-initialisation n'a pas fonctionné

### 2. Vérifier les logs de la console

**Rechargez votre application** (Ctrl+Shift+R) et ouvrez la console (F12).

Cherchez ces logs :

```
🚀 Initialisation de l'application...
🔍 Chargement des éléments depuis /api/elements...
```

#### Scénario A : Chargement réussi

```
🔍 Chargement des éléments depuis /api/elements...
✅ Éléments reçus de l'API: 6
✅ Éléments ajoutés au store: 6
✅ Application initialisée
📊 Éléments chargés: 6
```

→ **Tout fonctionne !** Les éléments devraient s'afficher.

#### Scénario B : Erreur API

```
🔍 Chargement des éléments depuis /api/elements...
❌ Erreur lors du chargement des éléments: { ... }
```

→ **Problème côté serveur**. Vérifiez l'erreur détaillée.

#### Scénario C : Aucune donnée

```
🔍 Chargement des éléments depuis /api/elements...
⚠️ Aucune donnée reçue de /api/elements
```

→ **L'API répond mais ne retourne rien**. Problème d'auto-initialisation.

#### Scénario D : 0 éléments

```
🔍 Chargement des éléments depuis /api/elements...
✅ Éléments reçus de l'API: 0
✅ Éléments ajoutés au store: 0
```

→ **La table Element est vide** et l'auto-initialisation a échoué.

### 3. Vérifier la base de données

Ouvrez Prisma Studio :

```bash
npm run db:studio
```

Si vous obtenez une erreur de connexion, c'est normal pour les scripts. Dans ce cas, vérifiez directement via MySQL :

```bash
# Connectez-vous à MySQL
mysql -u root -p

# Sélectionnez votre base de données
USE gloomhavenDB;

# Vérifiez si la table Element existe
SHOW TABLES LIKE 'Element';

# Si elle existe, comptez les éléments
SELECT COUNT(*) FROM Element;

# Affichez les éléments
SELECT * FROM Element;
```

#### ✅ Résultat attendu

```
+----+-----------+------------------------------------+
| id | name      | imagePath                          |
+----+-----------+------------------------------------+
|  1 | Feu       | /img/Elements/FirePicture.png      |
|  2 | Ténèbre   | /img/Elements/DarknessPicture.png  |
|  3 | Terre     | /img/Elements/EarthPicture.png     |
|  4 | Vent      | /img/Elements/WindPicture.png      |
|  5 | Lumière   | /img/Elements/LightPicture.png     |
|  6 | Givre     | /img/Elements/FrostPicture.png     |
+----+-----------+------------------------------------+
6 rows in set
```

#### ❌ Si la table est vide

→ L'auto-initialisation n'a pas fonctionné. Créons les éléments manuellement.

### 4. Solutions selon le problème

#### Solution A : La table Element est vide

**Créez les éléments manuellement dans MySQL** :

```sql
USE gloomhavenDB;

INSERT INTO Element (id, name, imagePath) VALUES
(1, 'Feu', '/img/Elements/FirePicture.png'),
(2, 'Ténèbre', '/img/Elements/DarknessPicture.png'),
(3, 'Terre', '/img/Elements/EarthPicture.png'),
(4, 'Vent', '/img/Elements/WindPicture.png'),
(5, 'Lumière', '/img/Elements/LightPicture.png'),
(6, 'Givre', '/img/Elements/FrostPicture.png');
```

Ensuite, rechargez votre application.

#### Solution B : L'endpoint /api/elements ne fonctionne pas

Vérifiez que le fichier existe :

```bash
C:\Users\cybea\WebstormProjects\GloomhavenCompanionNuxt\server\api\elements\index.get.ts
```

Si le fichier n'existe pas, créez-le (voir plus bas).

#### Solution C : Problème de connexion DB

Vérifiez votre fichier `.env` :

```env
DATABASE_URL="mysql://root:VOTRE_MOT_DE_PASSE@localhost:3306/gloomhavenDB"
```

Assurez-vous que :
- Le mot de passe est correct
- La base de données `gloomhavenDB` existe
- MySQL est démarré

#### Solution D : L'auto-initialisation ne fonctionne pas

Le fichier `server/utils/initElements.ts` existe-t-il ?

Si non, l'auto-initialisation ne peut pas fonctionner. Dans ce cas, utilisez **Solution A** pour créer les éléments manuellement.

### 5. Test final

Après avoir appliqué une solution :

1. **Rechargez complètement** l'application (Ctrl+Shift+R)
2. **Vérifiez la console** :
   ```
   ✅ Éléments reçus de l'API: 6
   ✅ Éléments ajoutés au store: 6
   ```
3. **Naviguez vers /game**
4. **Vérifiez** que les 6 éléments s'affichent

### 6. Logs serveur Nuxt

Regardez aussi les logs du serveur Nuxt (terminal où `npm run dev` est lancé).

Si vous voyez des erreurs comme :

```
✓ 6 éléments déjà présents dans la base de données
```

→ L'auto-initialisation fonctionne côté serveur !

Si vous voyez :

```
🔄 Aucun élément trouvé, initialisation en cours...
✓ 6 éléments créés
```

→ Les éléments viennent d'être créés !

Si vous voyez :

```
❌ Erreur lors de l'initialisation des éléments: ...
```

→ Problème de connexion DB ou autre erreur.

## Checklist de diagnostic

- [ ] 1. Ouvrir `http://localhost:3000/api/elements` → Résultat ?
- [ ] 2. Recharger l'app → Voir les logs console
- [ ] 3. Vérifier `appStore.elements.length` dans la console
- [ ] 4. Vérifier la table Element dans MySQL
- [ ] 5. Appliquer la solution appropriée
- [ ] 6. Recharger et vérifier à nouveau

## Création manuelle rapide des éléments

Si rien ne fonctionne, utilisez cette requête SQL directe :

```bash
# Ouvrez MySQL
mysql -u root -p

# Exécutez
USE gloomhavenDB;
DELETE FROM Element;
INSERT INTO Element (id, name, imagePath) VALUES
(1, 'Feu', '/img/Elements/FirePicture.png'),
(2, 'Ténèbre', '/img/Elements/DarknessPicture.png'),
(3, 'Terre', '/img/Elements/EarthPicture.png'),
(4, 'Vent', '/img/Elements/WindPicture.png'),
(5, 'Lumière', '/img/Elements/LightPicture.png'),
(6, 'Givre', '/img/Elements/FrostPicture.png');

# Vérifiez
SELECT * FROM Element;
```

Ensuite, rechargez l'application !

## Contact

Partagez-moi les logs de votre console et je pourrai vous aider plus précisément ! 🔍
