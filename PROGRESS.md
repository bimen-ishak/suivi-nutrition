# Suivi Nutrition — Progression

## Phase 0 : Cadrage ✅
- [x] Questions posées et réponses reçues
- [x] Analyse du tableau Excel existant (3 feuilles : Bilan, Journal, Photos)
- [x] Recherche technique : PWA vs Expo vs Swift
- [x] Choix validé : **PWA installable**
- [x] Limites identifiées et solutions de contournement validées

### Décisions Phase 0
- iPhone 17 Pro Max, Windows 11, pas de Mac, pas de compte Apple Developer
- PWA choisie (0 €, pas de dépendance Apple)
- Code-barres : ZXing.js (BarcodeDetector non supporté sur Safari)
- Notifications : alertes dans l'app uniquement (Web Push non supporté iOS)
- Stockage : IndexedDB + sauvegarde/restauration par fichier JSON (protection contre effacement 7 jours)
- Rappels fixes : via app Rappels iPhone (config manuelle)

## Phase 1 : Conception ✅
- [x] Rédaction de SPEC.md
- [x] Rédaction de PLAN.md
- [x] Validation utilisateur

## Phase 2 : Initialisation du projet ✅
- [x] Création du squelette React + TypeScript + Vite
- [x] Configuration Vitest
- [x] Installation des dépendances (Dexie, ZXing, SheetJS, PWA)
- [x] Structure de dossiers (components, pages, hooks, utils, db, types)
- [x] Types TypeScript de base (Food, JournalEntry, DailySummary, MealTemplate)
- [x] Base de données Dexie.js avec schémas et méthodes CRUD
- [x] Fonctions de calcul pur (calculations.ts) avec 34 tests unitaires
  - Sodium depuis sel
  - Portions personnalisées
  - Nutrition pour quantité
  - Tare, différence, restes
  - Sommeil (passage minuit)
  - Bilan quotidien
  - Cohérence macros/kcal
- [x] Build de production réussi
- [x] Serveur de développement fonctionnel (localhost:5173)

## Phase 3 : Bibliothèque d'aliments 🔄
- [x] Composant FoodCard (affichage d'un aliment)
- [x] Composant FoodForm (création/modification d'aliment avec validation)
- [x] Page Library (liste, recherche, onglets Mes aliments / Génériques)
- [x] CRUD complet : créer, lire, modifier, supprimer
- [x] Gestion des portions personnalisées
- [x] Calcul automatique sodium depuis sel
- [x] Types stricts TypeScript
- [x] Build et tests passent

## Prochaine action
Passer à la Phase 4 : Ajout d'aliment manuel (formulaire complet déjà fait, maintenant intégration dans l'écran "Ajouter un aliment").
