# SPEC — Application de Suivi Nutritionnel

## Vue d'ensemble

Application PWA 100% locale pour suivre son alimentation, son poids et son activité dans le cadre d'un régime à −500 kcal/jour.

**Principe clé** : après le premier scan d'un aliment, le saisir en 2-3 touches maximum.

## Contraintes techniques

- PWA installable sur iPhone (iOS 17+)
- Fonctionnement 100% hors ligne (mode avion)
- Aucun serveur, aucun compte, aucune donnée envoyée
- Données locales (IndexedDB) + sauvegarde/restauration par fichier JSON
- Pas de notifications push (limitation iOS) → alertes dans l'app uniquement
- Code-barres via ZXing.js (BarcodeDetector non supporté Safari)

## Stack technique

- **React** + **TypeScript**
- **Vite** (build)
- **IndexedDB** via **Dexie.js** (base de données locale)
- **Vitest** (tests unitaires)
- **Workbox** (Service Worker pour mode hors ligne)
- **ZXing.js** (scan code-barres)
- **tesseract.js** (V2, lecture OCR d'étiquette)

---

## Parcours utilisateur détaillés

### Parcours 1 : Aliment connu avec code-barres (ex: céréales du matin)

**Objectif** : 2-3 touches après le premier scan

#### Premier scan (une seule fois)
1. Écran d'accueil → bouton **« + Ajouter un aliment »**
2. Écran de saisie → bouton **« Scanner code-barres »**
3. Caméra s'ouvre, je scanne le code-barres
4. L'app demande : **« Cet aliment n'existe pas encore. Le créer ? »**
5. Je tape le nom : « Céréales Lidl chocolat noix cajou »
6. Je saisis les valeurs pour 100 g (depuis l'étiquette) :
   - kcal : 442
   - Protéines : 28.2
   - Glucides : 44.6
   - Sucres : (optionnel)
   - Lipides : 17.4
   - Fibres : (optionnel)
   - Sel : 0.02 (l'app calcule sodium automatiquement)
   - Potassium : 500 (optionnel, peut rester vide)
7. Je définis des portions rapides (optionnel) :
   - « 1 bol » = 100 g
8. Je valide → l'aliment est enregistré dans ma bibliothèque

#### Scans suivants (quotidien)
1. Écran d'accueil → **« + Ajouter »**
2. **« Scanner »** → je scanne le code-barres
3. L'app reconnaît : **« Céréales Lidl chocolat noix cajou »**
4. Je saisis le poids : **« 100 »** (clavier numérique)
   - OU je tape **« 1 »** et je choisis **« bol »** dans la liste des portions
5. Je choisis le repas : **« Petit-déj »** (liste : Petit-déj, Collation, Déjeuner, Dîner, Repas, Boisson)
6. Je valide → **c'est enregistré** (3 touches : scan, poids, repas)

---

### Parcours 2 : Aliment connu sans code-barres (ex: banane)

**Objectif** : recherche rapide, fréquence et heure d'habitude

#### Premier enregistrement
1. **« + Ajouter »** → **« Rechercher »**
2. Je tape **« ban »** → l'app propose :
   - « Banane (générique) » (base hors ligne)
3. Je sélectionne
4. L'app affiche les valeurs pour 100 g (base générique, marquées **« estimation »**)
5. Je saisis le poids : **« 175 »**
6. Je choisis le repas : **« Collation »**
7. Je valide

#### Fois suivantes (avec fréquence)
1. **« + Ajouter »**
2. L'écran affiche 2 sections :
   - **« Fréquents à cette heure »** (tri par heure habituelle, ex: 10h → banane, fromage blanc)
   - **« Les plus utilisés »** (tri par fréquence globale)
3. Je tape directement sur **« Banane »**
4. Je saisis le poids : **« 119 »**
5. Repas pré-rempli : **« Collation »** (basé sur l'habitude)
6. Je valide → **2 touches (aliment, poids)**

---

### Parcours 3 : Repas pesé avec calcul par différence

**Exemple** : poulet avec os et peau

1. **« + Ajouter »** → je cherche **« Poulet »**
2. Je sélectionne **« Poulet rôti sans peau (viande) »**
3. Au lieu de saisir un poids simple, je tape sur **« Calcul avancé »**
4. L'app propose 3 modes :
   - **« Tare »** : poids total − poids du bol
   - **« Différence »** : poids avant − poids après
   - **« Restes »** : poids servi − poids restant
5. Je choisis **« Restes »**
6. Je saisis :
   - Poids servi : **« 675 »**
   - Poids des restes (os + peau) : **« 119 »**
7. L'app calcule automatiquement : **556 g mangés**
8. Je valide → enregistré avec note : **« 556 g mangés (675 g − 119 g restes) »**

---

### Parcours 4 : Repas type (ex: petit-déj habituel)

**Objectif** : relancer en 1 touche, ajuster uniquement les poids

#### Création du repas type
1. Après avoir saisi mon petit-déj habituel (céréales + lait), l'app propose :
   - **« Enregistrer comme repas type ? »**
2. Je valide, je nomme : **« Petit-déj standard »**
3. Le repas type contient :
   - Céréales Lidl chocolat noix cajou : 100 g
   - Lait demi-écrémé Lidl : 200 ml

#### Utilisation quotidienne
1. **« + Ajouter »** → onglet **« Repas types »**
2. Je tape sur **« Petit-déj standard »**
3. L'app affiche les 2 aliments avec leurs quantités pré-remplies
4. Je peux ajuster chaque quantité si besoin :
   - Céréales : 100 → **50** (si j'ai moins faim)
   - Lait : 200 → **199** (quantité pesée réelle)
5. Je valide → les 2 aliments sont enregistrés d'un coup

---

### Parcours 5 : Aliment ambigu (portion non définie)

**Exemple** : biscuits où je tape « 4 biscuits » mais l'app ne sait pas combien pèse 1 biscuit

1. Je cherche **« Biscuits Prince »**
2. Je tape **« 4 »** et je choisis **« biscuits »** dans la liste des unités
3. L'app ne trouve pas la définition de « 1 biscuit » pour cet aliment
4. Elle affiche : **« Combien pèse 1 biscuit ? »**
5. Je saisis : **« 12.5 »** (je lis l'étiquette)
6. L'app propose : **« Enregistrer "1 biscuit = 12.5 g" pour les prochaines fois ? »**
7. Je valide → l'app calcule : **4 × 12.5 = 50 g**
8. C'est enregistré, et la prochaine fois « 4 biscuits » sera automatique

---

### Parcours 6 : Changement de recette (nouvelle version d'étiquette)

**Exemple** : je scanne mes céréales et les valeurs ont changé

1. Je scanne le code-barres de mes céréales
2. L'app affiche : **« Céréales Lidl chocolat noix cajou »**
3. Je saisis le poids : **« 100 »**
4. L'app détecte que je veux modifier l'aliment (bouton « Éditer » visible)
5. Je tape **« Éditer »**, je modifie les valeurs nutritionnelles
6. L'app demande : **« Les valeurs ont changé. Que faire ? »**
   - **« Mettre à jour »** (remplace l'ancienne version, appliqué aux futures saisies uniquement)
   - **« Créer une version datée »** (garde les 2 versions : « Céréales Lidl v1 (avant 06/11/2026) » et « Céréales Lidl v2 (depuis 06/11/2026) »)
7. Je choisis **« Mettre à jour »**
8. L'app confirme : **« L'historique n'est PAS modifié. Seules les nouvelles saisies utilisent la nouvelle version. »**

---

### Parcours 7 : Étiquette floue ou illisible (V2)

**Objectif** : lecture OCR avec vérification et calcul de cohérence

1. **« + Ajouter »** → **« Photographier étiquette »**
2. Je prends une photo de l'étiquette
3. L'app traite avec tesseract.js (2-3 secondes)
4. Elle affiche les champs reconnus :
   - kcal : **442** ✅
   - Protéines : **28.2** ✅
   - Glucides : **44.6** ⚠️ (surligné en jaune, confiance moyenne)
   - Lipides : **17.4** ✅
   - Sel : **0.02** ✅
5. Je peux corriger les champs surlignés
6. L'app vérifie la cohérence : **lipides × 9 + glucides × 4 + protéines × 4 ≈ kcal**
   - Calcul : 17.4 × 9 + 44.6 × 4 + 28.2 × 4 = 156.6 + 178.4 + 112.8 = 447.8 ≈ 442 ✅
7. Si incohérent, elle affiche : **« Attention : les macros ne correspondent pas aux kcal (écart > 10%). Vérifier les valeurs. »**
8. Je valide → aliment créé avec source **« étiquette (OCR) »**

---

### Parcours 8 : Aliment de restaurant (estimation)

**Exemple** : donut acheté en boulangerie

1. **« + Ajouter »** → **« Rechercher »**
2. Je tape **« donut »**
3. L'app affiche :
   - **« Donut au sucre (générique) »** — estimation
   - Source : base USDA / OpenFoodFacts
4. Je sélectionne, je saisis le poids : **« 26 »**
5. L'app affiche bien visible : **« ⚠️ Valeurs estimées (base générique) »**
6. Je valide → enregistré avec marqueur **« estimation »** dans le journal

---

## Écrans principaux

### 1. Écran d'accueil (Tableau de bord)

**Affichage du jour actuel :**
- Date du jour
- Carte **« Bilan du jour »** :
  - Calories mangées : **805 kcal**
  - Calories brûlées : **? kcal** (non saisies) → bouton **« Saisir »**
  - Bilan net : **« Saisir ta dépense pour voir le bilan »**
  - Protéines / Glucides / Lipides (barres colorées)
- Carte **« Aliments du jour »** (liste chronologique, derniers en haut)
  - 08:30 — Céréales Lidl 50 g — 221 kcal
  - 10:15 — Banane 119 g — 106 kcal
  - (bouton **« Modifier »** et **« Supprimer »** sur chaque ligne)
- Bouton principal : **« + Ajouter un aliment »** (gros, en bas, toujours visible)

**Navigation** (barre du bas) :
- 🏠 **Aujourd'hui** (actuel)
- 📊 **Historique**
- 📚 **Bibliothèque**
- ⚙️ **Paramètres**

---

### 2. Écran **« Ajouter un aliment »**

**4 onglets horizontaux :**
- **« Fréquents »** : aliments triés par fréquence + heure habituelle
- **« Scanner »** : caméra + ZXing.js
- **« Rechercher »** : champ de recherche dans bibliothèque + base générique
- **« Repas types »** : liste des repas types enregistrés

**Après sélection d'un aliment :**
- Nom de l'aliment affiché en haut
- Valeurs pour 100 g (lecture seule, source visible)
- Champ **« Quantité »** (clavier numérique)
  - Bascule **g / ml / portions** (si portions définies)
  - Bouton **« Calcul avancé »** (tare, différence, restes)
- Champ **« Repas »** (menu déroulant pré-rempli selon l'heure)
- Aperçu en temps réel : **« = 221 kcal, 14.1 g protéines… »**
- Bouton **« Valider »** (gros, en bas)

---

### 3. Écran **« Historique »**

**Sélecteur de date** (glisser horizontalement ou calendrier)

**Pour chaque jour :**
- Carte **« Bilan »** (résumé : kcal, bilan net, macros, poids, sommeil)
- Liste des aliments du jour (groupés par repas)
- Bouton **« Modifier le jour »** (poids, sommeil, dépense)

**Graphiques** (à déployer) :
- Poids sur 7 / 30 jours (moyenne glissante)
- Bilan net cumulé
- Macros moyens

---

### 4. Écran **« Bibliothèque »**

**3 onglets :**
- **« Mes aliments »** : aliments scannés/créés par l'utilisateur
- **« Génériques »** : base hors ligne (fruits, légumes, viandes…)
- **« Repas types »**

**Pour chaque aliment :**
- Nom, marque (si applicable)
- Valeurs pour 100 g
- Source : **étiquette** / **estimation**
- Fréquence d'utilisation
- Date de dernière utilisation
- Code-barres (si applicable)
- Bouton **« Modifier »** / **« Supprimer »**

---

### 5. Écran **« Paramètres »**

**Sections :**
- **Sauvegarde et restauration**
  - Bouton **« Sauvegarder toutes mes données »** → télécharge JSON
  - Bouton **« Restaurer mes données »** → importe JSON
  - Dernière sauvegarde : 06/11/2026 08:45
- **Export Excel**
  - Bouton **« Exporter en Excel »** → télécharge .xlsx compatible avec le tableau existant
  - Période : derniers 7 / 30 jours / tout
- **Objectif**
  - Déficit calorique quotidien : **−500 kcal** (modifiable)
- **Notifications** (V2)
  - Alerte à l'ouverture si pesée manquante
  - Alerte si dépense du jour non saisie
- **Base de données générique**
  - Version : OpenFoodFacts v2026.11 (hors ligne, 500 aliments courants)
  - Bouton **« Mettre à jour »** (si connexion Internet)
- **À propos**
  - Version de l'app
  - Licence

---

## Gestion des cas particuliers

### Cas 1 : Étiquette illisible
→ Lecture OCR (V2) avec confirmation des champs + vérification macro/kcal

### Cas 2 : Valeurs changées (nouvelle recette)
→ Proposer mise à jour ou version datée. **L'historique n'est jamais modifié.**

### Cas 3 : Portion ambiguë
→ Demander la valeur, proposer de l'enregistrer pour les prochaines fois

### Cas 4 : Aliment de restaurant
→ Recherche dans base générique, marquage **« estimation »** bien visible

### Cas 5 : Poids oublié
→ Impossible de valider sans poids (champ obligatoire)

### Cas 6 : Sodium manquant sur étiquette
→ Si sel est présent : sodium (mg) = sel (g) × 400
→ Si potassium manquant : laisser vide (pas d'estimation hasardeuse)

### Cas 7 : Correction d'une saisie
→ Bouton **« Modifier »** sur chaque aliment du journal
→ Recalcul automatique des totaux du jour

### Cas 8 : Suppression d'une saisie
→ Bouton **« Supprimer »** avec confirmation
→ Recalcul automatique

---

## Bilan quotidien

### Saisie de la dépense
**2 moments possibles :**
1. **En cours de journée** : saisie provisoire (calories de repos + activité estimée)
2. **Le soir ou le lendemain matin** : saisie finale (total réel de l'Apple Watch)

**Champs :**
- Calories de repos (ex: 1700)
- Calories d'activité (ex: 500)
- **Total brûlé = 2200**
- Marqueur **« provisoire »** ou **« final »**

**Calcul du bilan :**
- Bilan net = mangé − brûlé
- Objectif = −500 kcal

**Affichage intelligent :**
- Si bilan net > −500 : **« Il te faut brûler 200 kcal de plus pour atteindre −500 »**
- Si bilan net < −500 : **« Il te reste 300 kcal à manger pour atteindre −500 »**
- Si dépense provisoire : **« Estimation provisoire. Mettre à jour avec le total final de ta montre. »**

---

## Poids et tendance

### Saisie du poids
- Champ **« Poids du matin »** (en kg, décimales autorisées)
- Date automatique (jour actuel)

### Calculs affichés
1. **Poids actuel** : 83.2 kg (ce matin)
2. **Moyenne 7 jours** : 82.4 kg
3. **Tendance** (basée sur le déficit cumulé) :
   - Déficit cumulé sur 7 jours : −3 500 kcal
   - Perte théorique : 3 500 / 7 700 = **0.45 kg**
   - Poids « vrai » estimé : 83.2 − rétention d'eau estimée
4. **Explication si écart** :
   - « Tu as mangé beaucoup de sel hier (3 000 mg de sodium). Le poids peut être gonflé de 0.5 à 1 kg d'eau. »
   - « Tu as fait beaucoup d'activité hier (1 200 kcal brûlées). Le glycogène et l'eau peuvent augmenter le poids temporairement. »

---

## Sommeil

### Saisie
- Heure de coucher (ex: 23:30)
- Heure de lever (ex: 07:00)
- Calcul automatique de la durée (gère minuit) : **7 h 30**
- Stockage en heures décimales pour l'export Excel : **7.5**

---

## Nutriments suivis

**Obligatoires :**
- kcal
- Protéines (g)
- Glucides (g)
- Lipides (g)

**Optionnels (affichés si présents) :**
- Sucres (g)
- Fibres (g)
- Sel (g) → calcul automatique du sodium
- Sodium (mg)
- Potassium (mg) — si absent sur étiquette, reste vide (pas d'estimation)

**Calcul sodium :**
```
Si sel présent : sodium (mg) = sel (g) × 400
Sinon : utiliser sodium de l'étiquette (si présent)
Sinon : laisser vide
```

---

## Corrections et modifications

### Modifier un aliment du journal
1. Taper sur l'aliment dans la liste du jour
2. Modifier la quantité, le repas ou l'aliment lui-même
3. Valider → **recalcul automatique des totaux**

### Annuler une saisie
1. Bouton **« Supprimer »** sur l'aliment
2. Confirmation : **« Supprimer "Banane 119 g" ? »**
3. Suppression → **recalcul automatique**

### Historique des modifications
**Non implémenté en V1** (trop complexe). Les modifications écrasent l'ancienne valeur.

---

## Rappels (V2)

**Limitation iOS** : pas de notifications push en arrière-plan pour les PWA.

**Solution hybride :**
1. **Rappels iPhone** (app native) :
   - Je configure manuellement 2 rappels fixes :
     - 07:00 : « Pesée du matin »
     - 22:00 : « Saisir le total de la montre »
2. **Alertes dans l'app** :
   - À l'ouverture, si pesée manquante : **« N'oublie pas ta pesée du matin ! »**
   - Si dépense non saisie en fin de journée : **« Pense à saisir ton total de calories brûlées. »**

---

## Export CSV / Excel

### Format Excel (compatible avec le tableau existant)

**3 feuilles :**

#### Feuille 1 : Bilan quotidien
| Colonne | Contenu |
|---------|---------|
| A | Date |
| B | Poids (kg) |
| C | Calories mangées |
| D | Calories brûlées |
| E | Bilan net |
| F | Protéines (g) |
| G | Glucides (g) |
| H | Lipides (g) |
| I | Aliments mangés (texte, séparés par `;`) |
| J | Potassium (mg) |
| K | Sodium (mg) |
| L | Sommeil (h, en décimal) |

#### Feuille 2 : Journal
| Colonne | Contenu |
|---------|---------|
| A | Date |
| B | Repas |
| C | Aliment (avec notes méthode) |
| D | Quantité (texte libre) |
| E | kcal |
| F | Protéines (g) |
| G | Glucides (g) |
| H | Lipides (g) |
| I-J | (vides) |
| K | Potassium (mg) |
| L | Sodium (mg) |

#### Feuille 3 : Bibliothèque (bonus, pas dans le tableau actuel)
| Colonne | Contenu |
|---------|---------|
| A | Nom |
| B | Marque |
| C | Code-barres |
| D | kcal / 100 g |
| E | Protéines |
| F | Glucides |
| G | Lipides |
| H | Sodium |
| I | Potassium |
| J | Source (étiquette / estimation) |
| K | Fréquence |
| L | Dernière utilisation |

**Export via :**
- Librairie **SheetJS** (XLSX.js) côté client
- Bouton **« Exporter en Excel »** → téléchargement immédiat

---

## Sauvegarde et restauration

### Format JSON
```json
{
  "version": "1.0.0",
  "exportDate": "2026-11-06T08:50:00Z",
  "foods": [
    {
      "id": "uuid-1",
      "name": "Céréales Lidl chocolat noix cajou",
      "brand": "Lidl",
      "barcode": "12345678",
      "kcal_per_100g": 442,
      "protein": 28.2,
      "carbs": 44.6,
      "fat": 17.4,
      "sodium": 8,
      "potassium": 500,
      "source": "étiquette",
      "portions": [
        { "name": "bol", "grams": 100 }
      ],
      "frequency": 25,
      "lastUsed": "2026-11-06"
    }
  ],
  "journal": [
    {
      "date": "2026-11-06",
      "time": "08:30",
      "meal": "Petit-déj",
      "foodId": "uuid-1",
      "quantity": 50,
      "unit": "g",
      "calculation": null
    }
  ],
  "dailySummaries": [
    {
      "date": "2026-11-06",
      "weight": 83.2,
      "caloriesEaten": 805,
      "caloriesBurned": null,
      "sleep": 6.33
    }
  ],
  "mealTemplates": [
    {
      "id": "uuid-2",
      "name": "Petit-déj standard",
      "items": [
        { "foodId": "uuid-1", "quantity": 100, "unit": "g" }
      ]
    }
  ]
}
```

### Boutons
- **« Sauvegarder »** → télécharge `suivi-nutrition-backup-2026-11-06.json`
- **« Restaurer »** → upload fichier JSON → confirmation → écrase les données locales

### Protection contre la perte (7 jours)
- Message dans les paramètres : **« ⚠️ Pense à sauvegarder régulièrement (au moins 1 fois par semaine). »**
- Affichage de la date de dernière sauvegarde

---

## Priorisation des fonctionnalités

### V1 — Indispensable (MVP)
- [x] Bibliothèque d'aliments personnelle
- [x] Scan code-barres (ZXing.js)
- [x] Recherche d'aliments
- [x] Liste par fréquence et heure
- [x] Saisie de portions personnalisées
- [x] Calculs de poids (tare, différence, restes)
- [x] Repas types
- [x] Corrections d'entrées
- [x] Bilan du jour (kcal, macros, bilan net)
- [x] Poids et tendance (moyenne 7 jours)
- [x] Sommeil
- [x] Export Excel
- [x] Sauvegarde/restauration JSON
- [x] Mode hors ligne (Service Worker)
- [x] Base d'aliments générique hors ligne (500 aliments courants)

### V2 — Utile
- [ ] Lecture OCR d'étiquette (tesseract.js)
- [ ] Vérification cohérence macros/kcal
- [ ] Versions de recette (datées)
- [ ] Graphiques avancés (courbes de poids, macros)
- [ ] Rappels / alertes dans l'app
- [ ] Bilan tous les 15 jours avec proposition d'ajustement d'objectif

### Bonus (après validation V2)
- [ ] Import de photos d'assiettes
- [ ] Reconnaissance visuelle d'aliments (IA, nécessite connexion)
- [ ] Comparaison avec un autre jour
- [ ] Notes libres sur un repas

---

## Tests obligatoires (automatisés)

Les calculs suivants doivent être testés avec Vitest :

```typescript
// Test 1 : Calcul de tare
test('bol 200g − céréales 100g = 100g de lait', () => {
  expect(calculateTare(200, 100)).toBe(100);
});

// Test 2 : Calcul de restes
test('675g pesés − 119g os/peau = 556g mangés', () => {
  expect(calculateRemaining(675, 119)).toBe(556);
});

// Test 3 : Portions
test('4 biscuits × 5g = 20g', () => {
  expect(convertPortion(4, 'biscuit', { biscuit: 5 })).toBe(20);
});

// Test 4 : Sodium depuis sel
test('1.2g sel = 480mg sodium', () => {
  expect(calculateSodium(1.2)).toBe(480);
});

// Test 5 : Bilan net
test('2200 brûlées − 1400 mangées − 500 objectif = 300 kcal restantes', () => {
  expect(calculateRemaining(2200, 1400, -500)).toBe(300);
});

// Test 6 : Sommeil sur 2 jours
test('23h30 → 7h00 = 7.5h', () => {
  expect(calculateSleep('23:30', '07:00')).toBe(7.5);
});

// Test 7 : Recalcul après modification
test('Modifier lait 100ml → 200ml recalcule les totaux', () => {
  // Test d'intégration
});

// Test 8 : Nouvelle version ne modifie pas l'historique
test('Version 2 d\'un aliment n\'affecte pas les anciennes entrées', () => {
  // Test d'intégration
});
```

---

## Critères de succès (définition de « terminé »)

L'application est terminée si et seulement si :

1. ✅ Toutes les fonctionnalités V1 sont implémentées
2. ✅ Tous les tests automatisés passent
3. ✅ L'app fonctionne en mode avion sur iPhone
4. ✅ Un aliment connu se saisit en 2-3 touches maximum
5. ✅ Les exports Excel s'ouvrent correctement dans le tableau existant
6. ✅ La sauvegarde/restauration JSON fonctionne sans perte de données
7. ✅ L'app est installable sur l'écran d'accueil depuis Safari
8. ✅ Le Service Worker permet l'utilisation hors ligne

---

## Aliments fréquents de l'utilisateur (référence)

D'après l'analyse du tableau :
- Céréales chocolat noix et cajou Lidl (100 g quotidien)
- Lait demi-écrémé Lidl (150-200 ml quotidien)
- Fromage blanc 0% (Lidl, Aldi) (200-600 g variable)
- Sirop grenadine zéro sucres Plein Sud (30-50 g)
- Banane (100-200 g)
- Pain libanais nature (60-70 g)
- Poulet rôti / cuit (100-550 g viande mangée, souvent avec os)
- Chou-fleur rôti sans huile (150-350 g)
- Haricots verts rôtis sans huile (120-250 g)
- Biscuits divers (25-50 g)
- Orange (80-250 g)
- Pomme jaune (100-230 g)
- Mini cookies Délichoc (10-30 g)
- Œufs durs (215 g = 4 œufs)
- Fromage râpé / en tranches (30-60 g)

---

## Licence et données

- Code source : MIT (si open-source)
- Données utilisateur : 100% locales, jamais transmises
- Base générique : OpenFoodFacts (ODbL) ou USDA (domaine public)
