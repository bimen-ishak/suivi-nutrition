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

## Phase 1 : Conception 🔄
- [x] Rédaction de SPEC.md
- [x] Rédaction de PLAN.md
- [ ] Validation utilisateur

## Prochaine action
Attendre la validation de l'utilisateur sur SPEC.md (parcours, fonctionnalités, priorisation).
