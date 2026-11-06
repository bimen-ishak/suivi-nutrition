# PLAN — Feuille de route du projet

## Vue d'ensemble

Ce projet sera réalisé sur plusieurs sessions, potentiellement avec des modèles différents. Ce plan détaille toutes les phases, tâches et critères de validation.

**Principe de travail :**
1. Une seule tâche à la fois, de petite taille
2. Tests écrits AVANT le code des calculs
3. Après chaque tâche : lancer les tests, mettre à jour PROGRESS.md
4. Git commit après chaque tâche validée
5. À la fin de chaque phase : arrêt, résumé, instructions de test, attente de validation utilisateur

---

## Phase 0 : Cadrage ✅ TERMINÉE

### Objectif
Comprendre les besoins, analyser le tableau existant, choisir la technologie.

### Tâches réalisées
- [x] Questions posées (iPhone, Mac, Apple Developer, tableau)
- [x] Analyse du fichier Excel (3 feuilles, colonnes exactes)
- [x] Recherche technique PWA vs Expo vs Swift
- [x] Validation du choix : PWA

### Décisions Phase 0
- iPhone 17 Pro Max, Windows 11, pas de Mac, pas de compte Apple Developer
- PWA choisie (0 €, pas de dépendance Apple)
- Code-barres : ZXing.js
- Stockage : IndexedDB + sauvegarde JSON
- Pas de notifications push (limitation iOS)

---

## Phase 1 : Conception 🔄 EN COURS

### Objectif
Rédiger les spécifications complètes et valider les parcours utilisateur.

### Tâches
- [x] Rédaction de SPEC.md
- [x] Rédaction de PLAN.md
- [ ] Validation utilisateur

### Critères de réussite
- [ ] L'utilisateur a lu SPEC.md
- [ ] Les parcours sont validés
- [ ] Les cas particuliers sont couverts
- [ ] Les priorités V1/V2/Bonus sont claires

### Livrables
- SPEC.md
- PLAN.md
- PROGRESS.md mis à jour

---

## Phase 2 : Initialisation du projet (Version 1)

### Objectif
Créer la structure du projet React + TypeScript + Vite avec les outils de test et la base de données locale.

### Tâches

#### 2.1 — Création du squelette
- [ ] `npm create vite@latest` → React + TypeScript
- [ ] Installation des dépendances de base
- [ ] Configuration Vitest
- [ ] Configuration ESLint + Prettier
- [ ] Premier commit Git

**Test de validation :** `npm run dev` lance l'app sur localhost

#### 2.2 — Configuration PWA
- [ ] Installation de `vite-plugin-pwa`
- [ ] Configuration du manifest.json (nom, icônes, display: standalone)
- [ ] Configuration Workbox pour Service Worker
- [ ] Test du mode hors ligne

**Test de validation :** L'app s'installe sur l'écran d'accueil et fonctionne en mode avion

#### 2.3 — Base de données locale
- [ ] Installation de Dexie.js
- [ ] Définition du schéma :
  - Table `foods` (aliments)
  - Table `journal` (entrées quotidiennes)
  - Table `dailySummaries` (bilans quotidiens)
  - Table `mealTemplates` (repas types)
- [ ] Tests d'insertion/lecture/modification

**Test de validation :** Créer un aliment, le lire, le modifier, le supprimer

#### 2.4 — Structure de composants
- [ ] Création de la structure de dossiers :
  ```
  src/
    components/     # Composants réutilisables
    pages/          # Écrans principaux
    hooks/          # Custom hooks
    utils/          # Fonctions utilitaires et calculs
    db/             # Dexie schema et queries
    types/          # Types TypeScript
  ```
- [ ] Création des types TypeScript de base (Food, JournalEntry, DailySummary)

**Commit :** "Phase 2 : Initialisation du projet"

### Critères de réussite Phase 2
- [ ] `npm run dev` lance l'app
- [ ] `npm run test` exécute les tests
- [ ] L'app est installable sur l'écran d'accueil
- [ ] La base de données locale fonctionne
- [ ] Le code est typé (TypeScript)

---

## Phase 3 : Bibliothèque d'aliments (Version 1)

### Objectif
Créer, modifier, supprimer des aliments. Afficher la bibliothèque.

### Tâches

#### 3.1 — Modèle de données Food
```typescript
interface Food {
  id: string;                    // UUID
  name: string;
  brand?: string;
  barcode?: string;
  kcal_per_100g: number;
  protein: number;               // g
  carbs: number;                 // g
  sugars?: number;               // g, optionnel
  fat: number;                   // g
  fiber?: number;                // g, optionnel
  salt?: number;                 // g, optionnel
  sodium?: number;               // mg
  potassium?: number;            // mg
  source: 'étiquette' | 'estimation';
  portions: Portion[];
  frequency: number;             // compteur d'utilisations
  lastUsed: string;              // ISO date
  createdAt: string;
}

interface Portion {
  name: string;                  // ex: "biscuit", "bol", "carré"
  grams: number;
}
```

#### 3.2 — Tests des calculs sodium
- [ ] Écrire le test : `1.2g sel → 480mg sodium`
- [ ] Implémenter `calculateSodium(salt: number): number`
- [ ] Test doit passer

#### 3.3 — CRUD aliments
- [ ] Fonction `createFood(data: Partial<Food>): Promise<Food>`
- [ ] Fonction `updateFood(id: string, data: Partial<Food>): Promise<void>`
- [ ] Fonction `deleteFood(id: string): Promise<void>`
- [ ] Fonction `getFood(id: string): Promise<Food | undefined>`
- [ ] Tests unitaires

#### 3.4 — Écran Bibliothèque (lecture seule)
- [ ] Page `Bibliothèque` avec 2 onglets : "Mes aliments" / "Génériques"
- [ ] Liste des aliments (nom, marque, kcal/100g, source)
- [ ] Recherche par nom
- [ ] Navigation fonctionnelle

**Test de validation :** Créer 3 aliments manuellement (via console ou formulaire simple), les voir dans la bibliothèque

**Commit :** "Phase 3 : Bibliothèque d'aliments"

### Critères de réussite Phase 3
- [ ] Les aliments sont stockés dans IndexedDB
- [ ] La bibliothèque affiche les aliments créés
- [ ] Le calcul sodium fonctionne (test passe)

---

## Phase 4 : Ajout d'aliment manuel (Version 1)

### Objectif
Créer un nouvel aliment depuis un formulaire.

### Tâches

#### 4.1 — Formulaire de création
- [ ] Page/modal "Nouvel aliment"
- [ ] Champs :
  - Nom (obligatoire)
  - Marque (optionnel)
  - Code-barres (optionnel, pour l'instant manuel)
  - kcal/100g (obligatoire)
  - Protéines, Glucides, Lipides (obligatoires)
  - Sucres, Fibres (optionnels)
  - Sel OU Sodium (si sel saisi, calcul auto du sodium)
  - Potassium (optionnel)
  - Source : étiquette / estimation (boutons radio)
- [ ] Validation des champs (nombres positifs)
- [ ] Bouton "Créer"

#### 4.2 — Ajout de portions
- [ ] Section "Portions rapides" dans le formulaire
- [ ] Bouton "+ Ajouter une portion"
- [ ] Champs : nom (ex: "biscuit"), poids en g (ex: 12.5)
- [ ] Liste des portions ajoutées, avec bouton supprimer

**Test de validation :** Créer manuellement l'aliment "Céréales Lidl" avec ses valeurs, ajouter portion "bol = 100g", vérifier dans la bibliothèque

**Commit :** "Phase 4 : Ajout d'aliment manuel"

### Critères de réussite Phase 4
- [ ] Le formulaire crée un aliment fonctionnel
- [ ] Les portions sont enregistrées
- [ ] Le sodium est calculé depuis le sel

---

## Phase 5 : Scan de code-barres (Version 1)

### Objectif
Scanner un code-barres avec la caméra et ZXing.js.

### Tâches

#### 5.1 — Installation de ZXing.js
- [ ] `npm install @zxing/library`
- [ ] Création du composant `BarcodeScanner`
- [ ] Accès caméra via `getUserMedia()`
- [ ] Détection de code-barres en temps réel

#### 5.2 — Intégration dans "Ajouter un aliment"
- [ ] Bouton "Scanner code-barres" dans l'écran d'ajout
- [ ] Ouverture de la caméra
- [ ] Affichage du code-barres détecté
- [ ] Si code-barres déjà connu → afficher l'aliment
- [ ] Si code-barres inconnu → proposer de créer l'aliment

#### 5.3 — Sauvegarde du code-barres
- [ ] Lors de la création d'aliment, sauvegarder le code-barres
- [ ] Recherche par code-barres : `getFoodByBarcode(barcode: string)`

**Test de validation :** Scanner le code-barres des céréales, l'app propose de créer l'aliment, je le crée, je rescanne → l'app reconnaît l'aliment

**Commit :** "Phase 5 : Scan de code-barres"

### Critères de réussite Phase 5
- [ ] La caméra s'ouvre sur iPhone
- [ ] Les code-barres sont détectés
- [ ] Un code-barres connu est reconnu instantanément

---

## Phase 6 : Journal alimentaire (Version 1)

### Objectif
Enregistrer un aliment mangé avec sa quantité.

### Tâches

#### 6.1 — Modèle JournalEntry
```typescript
interface JournalEntry {
  id: string;
  date: string;                  // ISO date (YYYY-MM-DD)
  time: string;                  // HH:MM
  meal: MealType;
  foodId: string;
  foodName: string;              // dénormalisé pour affichage rapide
  quantity: number;
  unit: 'g' | 'ml' | string;     // ou nom de portion personnalisée
  calculation?: {
    type: 'tare' | 'difference' | 'remaining';
    values: number[];
  };
  // Valeurs calculées (dénormalisées)
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
  potassium?: number;
}

type MealType = 'Petit-déj' | 'Collation' | 'Déjeuner' | 'Dîner' | 'Repas' | 'Boisson';
```

#### 6.2 — Tests des calculs de quantité
- [ ] Test : `4 biscuits × 5g = 20g`
- [ ] Implémenter `convertPortion(quantity, portionName, portions)`
- [ ] Test doit passer

#### 6.3 — Calcul des valeurs nutritionnelles
- [ ] Fonction `calculateNutrition(food: Food, quantity: number, unit: string): Nutrition`
- [ ] Gère g, ml, et portions personnalisées
- [ ] Tests unitaires

#### 6.4 — Écran d'ajout d'un aliment mangé
- [ ] Après sélection d'un aliment (par scan ou recherche)
- [ ] Afficher : nom, marque, valeurs/100g, source
- [ ] Champ quantité (clavier numérique)
- [ ] Sélecteur d'unité : g / ml / portions (si définies)
- [ ] Sélecteur de repas (menu déroulant)
- [ ] Aperçu en temps réel : "= 221 kcal, 14.1g protéines..."
- [ ] Bouton "Valider"

#### 6.5 — Sauvegarde dans le journal
- [ ] `addJournalEntry(entry: JournalEntry): Promise<void>`
- [ ] Incrémenter `food.frequency`
- [ ] Mettre à jour `food.lastUsed`

**Test de validation :** Scanner céréales, saisir 100g, choisir Petit-déj, valider → l'aliment apparaît dans le journal du jour

**Commit :** "Phase 6 : Journal alimentaire"

### Critères de réussite Phase 6
- [ ] Un aliment peut être ajouté au journal
- [ ] Les calculs nutritionnels sont corrects
- [ ] Le journal stocke les entrées
- [ ] La fréquence est incrémentée

---

## Phase 7 : Écran Aujourd'hui (Version 1)

### Objectif
Afficher le tableau de bord du jour avec le bilan et la liste des aliments.

### Tâches

#### 7.1 — Page Aujourd'hui
- [ ] Affichage de la date du jour
- [ ] Carte "Bilan du jour" :
  - Calories mangées (somme du journal)
  - Calories brûlées (depuis DailySummary, ou "?" si non saisies)
  - Bilan net (si dépense saisie)
  - Barres de macros (protéines, glucides, lipides)
- [ ] Carte "Aliments du jour" :
  - Liste des aliments du journal, triés par heure (récents en haut)
  - Format : "08:30 — Céréales Lidl 50g — 221 kcal"
  - Boutons "Modifier" et "Supprimer" sur chaque ligne
- [ ] Bouton principal "+ Ajouter un aliment" (gros, en bas)

#### 7.2 — Requêtes DB
- [ ] `getJournalEntriesByDate(date: string): Promise<JournalEntry[]>`
- [ ] `getDailySummary(date: string): Promise<DailySummary | undefined>`
- [ ] Calculs des totaux du jour

#### 7.3 — Navigation
- [ ] Barre de navigation en bas : Aujourd'hui / Historique / Bibliothèque / Paramètres
- [ ] Icônes et labels

**Test de validation :** Ajouter 3 aliments au journal, vérifier qu'ils apparaissent sur l'écran Aujourd'hui avec les bons totaux

**Commit :** "Phase 7 : Écran Aujourd'hui"

### Critères de réussite Phase 7
- [ ] L'écran Aujourd'hui affiche le bilan du jour
- [ ] Les aliments du journal sont listés
- [ ] Les totaux sont corrects
- [ ] La navigation fonctionne

---

## Phase 8 : Recherche d'aliments (Version 1)

### Objectif
Chercher un aliment dans la bibliothèque sans scanner.

### Tâches

#### 8.1 — Écran "Ajouter un aliment" avec onglets
- [ ] Refactoriser en 4 onglets :
  - Fréquents
  - Scanner (existant)
  - Rechercher
  - Repas types (vide pour l'instant)

#### 8.2 — Onglet "Rechercher"
- [ ] Champ de recherche (texte libre)
- [ ] Recherche dans `foods` par nom ou marque (insensible à la casse)
- [ ] Affichage des résultats : nom, marque, kcal/100g, source
- [ ] Tap sur un résultat → écran de saisie de quantité

#### 8.3 — Onglet "Fréquents"
- [ ] Requête : aliments triés par fréquence (`frequency` décroissant)
- [ ] Affichage : même format que recherche
- [ ] Section "Fréquents à cette heure" (bonus, pour plus tard)

**Test de validation :** Chercher "céréales", trouver l'aliment, l'ajouter au journal

**Commit :** "Phase 8 : Recherche d'aliments"

### Critères de réussite Phase 8
- [ ] La recherche trouve les aliments par nom
- [ ] L'onglet Fréquents affiche les aliments les plus utilisés
- [ ] Un aliment trouvé peut être ajouté au journal

---

## Phase 9 : Calculs avancés (tare, différence, restes) (Version 1)

### Objectif
Gérer les pesées complexes.

### Tâches

#### 9.1 — Tests des calculs
- [ ] Test : `bol 200g − céréales 100g = 100g de lait` (tare)
- [ ] Test : `675g pesés − 119g restes = 556g mangés` (restes)
- [ ] Implémenter `calculateTare(total, item)` et `calculateRemaining(served, leftover)`
- [ ] Tests doivent passer

#### 9.2 — UI Calcul avancé
- [ ] Dans l'écran de saisie de quantité, bouton "Calcul avancé"
- [ ] Modal avec 3 modes :
  - **Tare** : poids total, poids d'un ingrédient → calcule l'autre
  - **Différence** : poids avant, poids après → calcule la différence
  - **Restes** : poids servi, poids restant → calcule mangé
- [ ] Résultat affiché et utilisé comme quantité
- [ ] Note enregistrée dans `JournalEntry.calculation`

#### 9.3 — Affichage dans le journal
- [ ] Format : "556 g mangés (675 g − 119 g restes)"
- [ ] Texte généré depuis `calculation`

**Test de validation :** Ajouter poulet avec calcul de restes (675 − 119), vérifier que 556g est enregistré et affiché correctement

**Commit :** "Phase 9 : Calculs avancés"

### Critères de réussite Phase 9
- [ ] Les 3 modes de calcul fonctionnent
- [ ] Les tests passent
- [ ] Le journal affiche la méthode de calcul

---

## Phase 10 : Repas types (Version 1)

### Objectif
Enregistrer et réutiliser des repas complets.

### Tâches

#### 10.1 — Modèle MealTemplate
```typescript
interface MealTemplate {
  id: string;
  name: string;
  items: {
    foodId: string;
    quantity: number;
    unit: string;
  }[];
  createdAt: string;
}
```

#### 10.2 — Création d'un repas type
- [ ] Après avoir ajouté plusieurs aliments au journal, bouton "Enregistrer comme repas type"
- [ ] Sélection des aliments du même repas
- [ ] Nommer le repas type
- [ ] Sauvegarde dans `mealTemplates`

#### 10.3 — Onglet "Repas types"
- [ ] Liste des repas types
- [ ] Tap sur un repas type → affiche les aliments avec quantités pré-remplies
- [ ] Possibilité d'ajuster les quantités
- [ ] Bouton "Valider" → ajoute tous les aliments au journal d'un coup

**Test de validation :** Créer un repas type "Petit-déj standard" (céréales + lait), le relancer, ajuster les quantités, valider

**Commit :** "Phase 10 : Repas types"

### Critères de réussite Phase 10
- [ ] Un repas type peut être créé
- [ ] Il peut être réutilisé avec ajustement des quantités
- [ ] Tous les aliments sont ajoutés au journal en une fois

---

## Phase 11 : Bilan quotidien et poids (Version 1)

### Objectif
Saisir le poids, la dépense calorique, le sommeil et afficher le bilan complet.

### Tâches

#### 11.1 — Modèle DailySummary
```typescript
interface DailySummary {
  date: string;                  // YYYY-MM-DD
  weight?: number;               // kg
  caloriesBurned?: number;
  caloriesBurnedProvisional?: boolean;
  caloriesRest?: number;
  caloriesActivity?: number;
  sleepBedtime?: string;         // HH:MM
  sleepWakeup?: string;          // HH:MM
  sleepDuration?: number;        // heures décimales
}
```

#### 11.2 — Tests calcul sommeil
- [ ] Test : `23h30 → 7h00 = 7.5h`
- [ ] Implémenter `calculateSleep(bedtime, wakeup)`
- [ ] Gérer le passage de minuit
- [ ] Test doit passer

#### 11.3 — Tests calcul bilan
- [ ] Test : `2200 brûlées − 1400 mangées − 500 objectif = 300 kcal restantes`
- [ ] Test : `2200 brûlées − 2500 mangées − 500 objectif = il faut brûler 200 kcal de plus`
- [ ] Implémenter `calculateDailyBalance(eaten, burned, objective)`
- [ ] Tests doivent passer

#### 11.4 — Formulaire de saisie
- [ ] Modal/page "Saisir le bilan du jour" (accessible depuis Aujourd'hui)
- [ ] Champs :
  - Poids (kg, décimales autorisées)
  - Calories de repos
  - Calories d'activité
  - Total brûlé (calculé auto)
  - Marqueur "provisoire / final"
  - Heure de coucher
  - Heure de lever
  - Durée de sommeil (calculée auto)
- [ ] Sauvegarde dans `dailySummaries`

#### 11.5 — Affichage dans "Aujourd'hui"
- [ ] Carte Bilan mise à jour :
  - Si dépense non saisie : bouton "Saisir"
  - Si dépense saisie : afficher bilan net
  - Message intelligent : "Il te reste X kcal à manger" ou "Il faut brûler X kcal de plus"
  - Si provisoire : note "Estimation provisoire"
- [ ] Affichage du poids du jour (si saisi)

#### 11.6 — Moyenne sur 7 jours
- [ ] Requête : derniers 7 jours de poids
- [ ] Calcul de la moyenne
- [ ] Affichage dans une section dédiée

**Test de validation :** Saisir poids, dépense, sommeil pour aujourd'hui, vérifier les calculs et l'affichage

**Commit :** "Phase 11 : Bilan quotidien et poids"

### Critères de réussite Phase 11
- [ ] Le poids, la dépense et le sommeil peuvent être saisis
- [ ] Les calculs sont corrects (tests passent)
- [ ] Le bilan net est affiché avec message intelligent
- [ ] La moyenne sur 7 jours est calculée

---

## Phase 12 : Corrections et suppression (Version 1)

### Objectif
Modifier ou supprimer une entrée du journal, avec recalcul des totaux.

### Tâches

#### 12.1 — Modifier une entrée
- [ ] Bouton "Modifier" sur chaque aliment du journal
- [ ] Rouvre l'écran de saisie avec valeurs pré-remplies
- [ ] Modification de la quantité, du repas ou de l'aliment
- [ ] Sauvegarde → recalcul automatique des totaux du jour

#### 12.2 — Supprimer une entrée
- [ ] Bouton "Supprimer" sur chaque aliment
- [ ] Modal de confirmation : "Supprimer 'Banane 119g' ?"
- [ ] Suppression → recalcul automatique

#### 12.3 — Recalcul des totaux
- [ ] Fonction `recalculateDailySummary(date: string)`
- [ ] Somme de tous les aliments du jour
- [ ] Mise à jour du bilan affiché

#### 12.4 — Test
- [ ] Test : modifier lait 100ml → 200ml, vérifier que les totaux changent

**Test de validation :** Ajouter un aliment, le modifier, vérifier les totaux, le supprimer, vérifier les totaux

**Commit :** "Phase 12 : Corrections et suppression"

### Critères de réussite Phase 12
- [ ] Une entrée peut être modifiée
- [ ] Une entrée peut être supprimée (avec confirmation)
- [ ] Les totaux se recalculent automatiquement

---

## Phase 13 : Historique (Version 1)

### Objectif
Consulter les jours passés.

### Tâches

#### 13.1 — Page Historique
- [ ] Sélecteur de date (glisser horizontalement ou calendrier)
- [ ] Affichage du journal du jour sélectionné
- [ ] Carte Bilan (identique à Aujourd'hui)
- [ ] Liste des aliments (groupés par repas)

#### 13.2 — Navigation entre jours
- [ ] Boutons "← Jour précédent" / "Jour suivant →"
- [ ] Ou swipe gauche/droite

**Test de validation :** Ajouter des aliments sur 3 jours différents, naviguer dans l'historique, vérifier l'affichage

**Commit :** "Phase 13 : Historique"

### Critères de réussite Phase 13
- [ ] L'historique affiche les jours passés
- [ ] La navigation entre jours fonctionne
- [ ] Le bilan de chaque jour est correct

---

## Phase 14 : Base d'aliments générique hors ligne (Version 1)

### Objectif
Fournir une base d'aliments courants (fruits, légumes, viandes) hors ligne.

### Tâches

#### 14.1 — Source de données
- [ ] Télécharger une base OpenFoodFacts (JSON) ou USDA
- [ ] Sélectionner ~500 aliments courants français
- [ ] Convertir au format `Food` avec `source: 'estimation'`

#### 14.2 — Pré-peuplement de la DB
- [ ] Script d'import : `importGenericFoods()`
- [ ] Exécution au premier lancement de l'app
- [ ] Marqueur dans IndexedDB pour éviter de ré-importer

#### 14.3 — Recherche dans les génériques
- [ ] Onglet "Génériques" dans Bibliothèque
- [ ] Recherche inclut les aliments génériques
- [ ] Distinction visuelle : badge "générique" ou "estimation"

**Test de validation :** Rechercher "banane", trouver l'aliment générique, l'ajouter au journal, vérifier le marqueur "estimation"

**Commit :** "Phase 14 : Base générique hors ligne"

### Critères de réussite Phase 14
- [ ] La base générique est importée au premier lancement
- [ ] Les aliments génériques sont trouvables via recherche
- [ ] Ils sont marqués "estimation"

---

## Phase 15 : Sauvegarde et restauration JSON (Version 1)

### Objectif
Protéger les données contre la perte (effacement 7 jours).

### Tâches

#### 15.1 — Export JSON
- [ ] Fonction `exportAllData(): Promise<BackupData>`
- [ ] Récupération de toutes les tables (foods, journal, dailySummaries, mealTemplates)
- [ ] Format JSON (cf SPEC.md)
- [ ] Téléchargement du fichier : `suivi-nutrition-backup-2026-11-06.json`

#### 15.2 — Import JSON
- [ ] Fonction `importAllData(data: BackupData): Promise<void>`
- [ ] Validation du format
- [ ] Modal de confirmation : "⚠️ Cette opération va écraser toutes les données actuelles. Continuer ?"
- [ ] Import et rechargement de l'app

#### 15.3 — UI dans Paramètres
- [ ] Section "Sauvegarde et restauration"
- [ ] Bouton "Sauvegarder toutes mes données"
- [ ] Bouton "Restaurer mes données" (upload fichier)
- [ ] Affichage de la date de dernière sauvegarde (stockée dans localStorage)

**Test de validation :** Créer des aliments et entrées, sauvegarder, effacer la DB, restaurer, vérifier que tout est revenu

**Commit :** "Phase 15 : Sauvegarde et restauration JSON"

### Critères de réussite Phase 15
- [ ] La sauvegarde télécharge un fichier JSON complet
- [ ] La restauration recrée toutes les données
- [ ] Un message d'avertissement s'affiche (sauvegarde régulière)

---

## Phase 16 : Export Excel (Version 1)

### Objectif
Exporter les données au format Excel compatible avec le tableau existant.

### Tâches

#### 16.1 — Installation de SheetJS
- [ ] `npm install xlsx`

#### 16.2 — Fonction d'export
- [ ] Fonction `exportToExcel(dateRange: 'week' | 'month' | 'all')`
- [ ] Génération de 3 feuilles :
  - Bilan quotidien (colonnes A-L exactes)
  - Journal (colonnes A-L exactes, I-J vides)
  - Bibliothèque (bonus, nouvelle feuille)
- [ ] Conversion des dates au format Excel
- [ ] Sommeil en décimal (7.5 pas 7:30)
- [ ] Téléchargement du fichier .xlsx

#### 16.3 — UI dans Paramètres
- [ ] Section "Export Excel"
- [ ] Sélecteur de période : 7 jours / 30 jours / Tout
- [ ] Bouton "Exporter en Excel"

**Test de validation :** Exporter les 7 derniers jours, ouvrir le fichier dans Excel, vérifier les colonnes et le format

**Commit :** "Phase 16 : Export Excel"

### Critères de réussite Phase 16
- [ ] Le fichier Excel est téléchargé
- [ ] Il s'ouvre correctement dans Excel/LibreOffice
- [ ] Les colonnes correspondent exactement au tableau existant
- [ ] Les données sont correctes

---

## Phase 17 : Tests et corrections (Version 1)

### Objectif
Passer en revue tous les tests, corriger les bugs, finaliser la V1.

### Tâches

#### 17.1 — Revue des tests automatisés
- [ ] Tous les tests unitaires passent
- [ ] Tests des calculs (tare, restes, portions, sodium, sommeil, bilan)
- [ ] Tests d'intégration (ajout/modification/suppression)

#### 17.2 — Tests manuels sur PC
- [ ] Parcours 1 : aliment avec code-barres (simulé)
- [ ] Parcours 2 : aliment sans code-barres
- [ ] Parcours 3 : calcul avancé
- [ ] Parcours 4 : repas type
- [ ] Export Excel
- [ ] Sauvegarde/restauration
- [ ] Mode hors ligne (désactiver le réseau)

#### 17.3 — Corrections des bugs identifiés

#### 17.4 — Documentation README.md
- [ ] Installation
- [ ] Utilisation locale (npm run dev)
- [ ] Installation sur iPhone (via hébergement ou réseau local)
- [ ] Sauvegarde des données
- [ ] Restauration des données

**Commit :** "Phase 17 : Tests et corrections V1"

### Critères de réussite Phase 17
- [ ] Tous les tests passent
- [ ] Les parcours manuels fonctionnent
- [ ] Le README est complet
- [ ] Aucun bug bloquant

---

## Phase 18 : Déploiement et installation sur iPhone (Version 1)

### Objectif
Rendre l'app accessible sur iPhone et l'installer.

### Tâches

#### 18.1 — Build de production
- [ ] `npm run build`
- [ ] Vérification du manifest.json
- [ ] Vérification du Service Worker
- [ ] Test du build en local

#### 18.2 — Hébergement (option A : hébergement gratuit)
- [ ] Créer un repo GitHub
- [ ] Configurer GitHub Pages ou Netlify
- [ ] Déploiement automatique
- [ ] URL HTTPS accessible

#### 18.2 bis — Réseau local (option B : serveur local)
- [ ] Script pour servir le build sur le réseau local
- [ ] Trouver l'IP locale du PC Windows
- [ ] Accès depuis iPhone via `http://192.168.x.x:3000`

#### 18.3 — Installation sur iPhone
- [ ] Ouvrir l'URL dans Safari sur iPhone
- [ ] Partager → "Sur l'écran d'accueil"
- [ ] Vérifier l'icône et le nom
- [ ] Lancer l'app depuis l'écran d'accueil

#### 18.4 — Tests sur iPhone réel
- [ ] Scan de code-barres (avec un vrai code-barres)
- [ ] Mode hors ligne (activer mode avion)
- [ ] Sauvegarde/restauration
- [ ] Export Excel
- [ ] Performance générale

**Test de validation :** L'app fonctionne sur iPhone en mode avion, le scan de code-barres fonctionne, les données sont sauvegardées

**Commit :** "Phase 18 : Déploiement V1"

### Critères de réussite Phase 18
- [ ] L'app est accessible depuis iPhone
- [ ] Elle est installable sur l'écran d'accueil
- [ ] Elle fonctionne hors ligne
- [ ] Le scan de code-barres fonctionne sur un vrai code-barres
- [ ] Les données persistent

---

## ✅ FIN DE LA VERSION 1

**Arrêt pour validation utilisateur**

Instructions pour l'utilisateur :
1. Installer l'app sur l'iPhone
2. L'utiliser pendant 1 semaine
3. Tester :
   - Ajout d'aliments connus (code-barres)
   - Ajout d'aliments génériques (banane, poulet)
   - Calculs avancés (poulet avec os)
   - Repas types
   - Export Excel → import dans le tableau existant
   - Sauvegarde/restauration
4. Remonter les bugs et suggestions

**Validation nécessaire avant de passer à la V2.**

---

## Phase 19 : Lecture OCR d'étiquette (Version 2)

### Objectif
Photographier une étiquette et extraire les valeurs nutritionnelles avec tesseract.js.

### Tâches

#### 19.1 — Installation de tesseract.js
- [ ] `npm install tesseract.js`
- [ ] Téléchargement des données de langue française

#### 19.2 — Composant PhotoOCR
- [ ] Bouton "Photographier étiquette" dans l'écran de création d'aliment
- [ ] Prise de photo
- [ ] Traitement OCR (2-3 secondes)
- [ ] Extraction des nombres
- [ ] Détection des mots-clés : "Énergie", "Protéines", "Glucides", "Lipides", "Sel"

#### 19.3 — Formulaire pré-rempli avec vérification
- [ ] Affichage des valeurs détectées
- [ ] Surlignage des valeurs avec faible confiance (< 80%)
- [ ] Possibilité de corriger chaque champ
- [ ] Calcul de cohérence : `lipides × 9 + glucides × 4 + protéines × 4 ≈ kcal`
- [ ] Alerte si écart > 10%

**Test de validation :** Photographier une étiquette réelle, vérifier les valeurs détectées, corriger si nécessaire, créer l'aliment

**Commit :** "Phase 19 : Lecture OCR d'étiquette"

### Critères de réussite Phase 19
- [ ] Une photo d'étiquette peut être prise
- [ ] Les valeurs sont extraites (même imparfaitement)
- [ ] L'utilisateur peut corriger
- [ ] La cohérence est vérifiée

---

## Phase 20 : Versions de recette (Version 2)

### Objectif
Gérer les changements de recette sans écraser l'historique.

### Tâches

#### 20.1 — Détection de changement
- [ ] Lors de la modification d'un aliment existant, comparer les valeurs
- [ ] Si changement > 5% sur au moins un nutriment : déclencher modal

#### 20.2 — Modal de choix
- [ ] "Les valeurs ont changé. Que faire ?"
  - **Mettre à jour** : écrase l'aliment (appliqué aux futures saisies uniquement)
  - **Créer une version datée** : crée un nouvel aliment "Nom v2 (depuis DATE)"
- [ ] Confirmation : "L'historique n'est PAS modifié"

#### 20.3 — Gestion des versions
- [ ] Si version datée créée : lier les 2 aliments (champ `parentId` ou `versionOf`)
- [ ] Affichage dans la bibliothèque : "Céréales Lidl v1 (avant 06/11/2026)" et "Céréales Lidl v2 (depuis 06/11/2026)"

#### 20.4 — Test
- [ ] Test : nouvelle version d'un aliment ne modifie pas les anciennes entrées du journal

**Test de validation :** Modifier un aliment, choisir "version datée", vérifier que l'historique utilise l'ancienne version, vérifier que les nouvelles saisies utilisent la nouvelle

**Commit :** "Phase 20 : Versions de recette"

### Critères de réussite Phase 20
- [ ] Une nouvelle version peut être créée
- [ ] L'historique n'est jamais modifié
- [ ] Les 2 versions coexistent dans la bibliothèque

---

## Phase 21 : Graphiques avancés (Version 2)

### Objectif
Afficher des courbes de poids et de macros.

### Tâches

#### 21.1 — Choix de librairie
- [ ] Installer Chart.js ou Recharts

#### 21.2 — Graphique de poids
- [ ] Courbe sur 7 / 30 jours
- [ ] Moyenne glissante (7 jours)
- [ ] Affichage dans Historique ou nouvelle page "Statistiques"

#### 21.3 — Graphiques de macros
- [ ] Répartition moyenne des macros (camembert)
- [ ] Évolution quotidienne (barres empilées)

**Test de validation :** Consulter les graphiques après 7 jours de données

**Commit :** "Phase 21 : Graphiques avancés"

### Critères de réussite Phase 21
- [ ] Les graphiques s'affichent correctement
- [ ] Ils sont lisibles et utiles

---

## Phase 22 : Alertes et rappels dans l'app (Version 2)

### Objectif
Afficher des alertes à l'ouverture de l'app.

### Tâches

#### 22.1 — Alerte pesée manquante
- [ ] À l'ouverture, si date = aujourd'hui et poids non saisi et heure > 8h00
- [ ] Bandeau : "N'oublie pas ta pesée du matin !"

#### 22.2 — Alerte dépense manquante
- [ ] Si heure > 22h00 et dépense non saisie
- [ ] Bandeau : "Pense à saisir ton total de calories brûlées"

#### 22.3 — Bilan tous les 15 jours
- [ ] Si date = dernier bilan + 15 jours
- [ ] Modal : "Bilan de ces 15 derniers jours : poids perdu, déficit moyen. Ajuster l'objectif ?"
- [ ] Proposition d'ajustement (si perte trop rapide ou trop lente)
- [ ] Confirmation utilisateur obligatoire

**Test de validation :** Simuler l'ouverture à 8h sans pesée, vérifier le bandeau

**Commit :** "Phase 22 : Alertes et rappels"

### Critères de réussite Phase 22
- [ ] Les alertes s'affichent au bon moment
- [ ] Elles ne sont pas intrusives
- [ ] Le bilan 15 jours propose un ajustement pertinent

---

## ✅ FIN DE LA VERSION 2

**Arrêt pour validation utilisateur**

Instructions pour l'utilisateur :
1. Tester la lecture d'étiquette OCR (5-10 étiquettes)
2. Modifier un aliment et créer une version datée
3. Consulter les graphiques
4. Vérifier les alertes

**Validation nécessaire avant les fonctions bonus.**

---

## Phase 23+ : Fonctions bonus (optionnelles)

À définir selon les retours utilisateur après la V2.

Suggestions :
- Import de photos d'assiettes (IA, nécessite connexion)
- Reconnaissance visuelle d'aliments
- Comparaison entre deux jours
- Notes libres sur un repas
- Export PDF
- Mode sombre

---

## Règles de travail (rappel)

1. **Une seule tâche à la fois**, de petite taille
2. **Tests écrits AVANT le code** des calculs
3. **Après chaque tâche** : lancer les tests, mettre à jour PROGRESS.md
4. **Git commit** après chaque tâche validée
5. **Ne jamais dire qu'une chose fonctionne sans l'avoir vérifiée**
6. **Indiquer clairement ce qui n'a pas pu être testé** (ex: sur iPhone)
7. **N'inventer aucune valeur nutritionnelle** : toute valeur porte la source
8. **N'ajouter aucune fonction hors spécifications sans proposition**
9. **À la fin de chaque phase** : arrêt, résumé, instructions de test, attente de validation
10. **Instructions simples et étape par étape** (l'utilisateur n'est pas forcément expert)

---

## Estimation de durée

**Phase 0** : ✅ Terminée
**Phase 1** : 🔄 En cours (conception)
**Phases 2-18 (V1)** : ~20-30 heures de développement
**Phases 19-22 (V2)** : ~8-12 heures de développement

Total estimé : **30-45 heures** sur plusieurs sessions.

---

## Fichiers de suivi

À chaque session, **lire en priorité** :
1. **PROGRESS.md** — où en est-on, prochaine action
2. **PLAN.md** (ce fichier) — quelle tâche faire ensuite
3. **SPEC.md** — référence fonctionnelle

**Mettre à jour PROGRESS.md** après chaque tâche terminée.
