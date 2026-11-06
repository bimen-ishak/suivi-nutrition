# 🥗 Suivi Nutrition

Application personnelle de **suivi nutritionnel 100 % hors ligne** (PWA), conçue pour un
iPhone (17 Pro Max) mais utilisable sur n'importe quel navigateur moderne.

- **0 € de coût** : aucun serveur, aucune API externe, aucune inscription.
- **100 % privé** : toutes les données restent sur l'appareil (IndexedDB + localStorage).
- **Fonctionne sans connexion** : une fois installée, l'app marche en mode avion.
- **Export Excel** compatible avec un tableau de suivi existant (3 feuilles : Bilan, Journal, Photos).

---

## ✨ Fonctionnalités (V1)

| Onglet | Description |
|---|---|
| 📅 **Aujourd'hui** | Bilan du jour (calories mangées / brûlées / bilan net vs objectif), macros (P/G/L), aliments groupés par repas, édition/suppression, **repas types** (💾 enregistrer un repas pour le rejouer en 1 clic) |
| ➕ **Ajouter** | Recherche dans la bibliothèque personnelle + ~150 aliments génériques hors ligne, **scan de code-barres** (caméra), création manuelle d'aliments, saisie de quantité en g/ml ou portions personnalisées, calculs avancés (tare, reste, durée de sommeil) |
| 📖 **Bibliothèque** | CRUD complet des aliments personnels, triés par fréquence d'utilisation |
| 📈 **Historique** | Jours précédents avec bilans et totaux |
| ⚙️ **Réglages** | **Objectif calorique personnalisé** (préréglages −1000 à 0), sauvegarde/restauration JSON, **export Excel (.xlsx)**, infos |

Détails dans [`SPEC.md`](../SPEC.md) — plan de développement dans [`PLAN.md`](../PLAN.md).

---

## 🛠 Prérequis

- **Windows 11** (développement fait ici) — fonctionne aussi sur macOS/Linux
- **Node.js 20+** : https://nodejs.org (cocher « Add to PATH » pendant l'installation)
- Un navigateur moderne pour tester en local (Edge/Chrome)
- Pour l'iPhone : **Safari** (seul navigateur qui permet d'installer une PWA sur l'écran d'accueil)

> Pas besoin de Mac ni de compte Apple Developer : la PWA s'installe via Safari,
> « Partager → Sur l'écran d'accueil ».

---

## 🚀 Installation & développement local

```bash
cd app
npm install        # une seule fois
npm run dev        # serveur local → http://localhost:5173
```

Autres commandes utiles :

```bash
npm run build      # build de production → dossier dist/
npm run preview    # prévisualiser le build (http://localhost:4173)
npm run lint       # oxlint
npm test           # tests unitaires (Vitest, mode watch)
npm run test:run   # tests en une fois (CI)
```

Tests : 34 tests unitaires sur les calculs purs (`src/utils/calculations.ts`) :
sodium↔sel, conversion portions→grammes, nutrition, tare, reste, durée de sommeil
(avec passage minuit), bilan quotidien, cohérence macros↔kcal.

---

## 📱 Installation sur iPhone (Phase 18)

L'app doit être servie en **HTTPS** (ou en `localhost`) pour que Safari propose l'installation.

### Option A — Hébergement gratuit (recommandé, accès depuis n'importe où)

1. `npm run build` → dossier `app/dist/`
2. Déployer `dist/` sur **GitHub Pages** (gratuit, HTTPS) ou **Netlify** (gratuit, HTTPS) :
   - GitHub Pages : créer un repo, pousser `dist/` sur la branche `gh-pages`
     (ou configurer Pages depuis le dossier `/dist`), URL du type
     `https://<pseudo>.github.io/<repo>/`
   - Netlify : glisser-déposer le dossier `dist/` sur https://app.netlify.com/drop
3. Sur l'iPhone, ouvrir l'URL dans **Safari**
4. `Partager` (⬆️) → **« Sur l'écran d'accueil »** → Ajouter
5. L'icône « Suivi Nutrition » apparaît : l'app s'ouvre en plein écran, sans barre Safari

### Option B — Réseau local (test rapide, iPhone sur le même Wi-Fi)

```bash
npm run dev -- --host        # affiche l'URL LAN, ex. http://192.168.1.42:5173
# ou servir le build : npx serve dist -l 4173   (puis ouvrir http://<IP-PC>:4173)
```
Sur l'iPhone, ouvrir cette URL dans Safari → « Sur l'écran d'accueil ».
⚠️ L'IP du PC peut changer ; l'option A est plus stable.

### Vérifications sur l'iPhone (vraie machine)

- [ ] Mode avion ON → l'app démarre et enregistre des aliments
- [ ] Scan de code-barres avec la caméra
- [ ] Persistance : fermer l'app, la rouvrir → données toujours là
- [ ] Export Excel → le fichier .xlsx s'ouvre (Files →Numbers/Excel)
- [ ] Sauvegarde JSON → restauration OK
- [ ] Ajout à l'écran d'accueil → icône + plein écran

> ⚠️ Safari peut purger le stockage local après ~7 jours sans ouvrir l'app :
> **faire une sauvegarde JSON régulièrement** (Réglages → Sauvegarder).

---

## 💾 Données, sauvegarde & export

- **Stockage** : IndexedDB (Dexie) pour aliments, journal, bilans journaliers, repas types ;
  localStorage pour l'objectif calorique et la date de dernière sauvegarde.
- **Sauvegarde JSON** (Réglages) : exporte toutes les données dans un fichier
  `suivi-nutrition-backup-AAAA-MM-JJ.json` → à conserver dans Fichiers/iCloud.
- **Restauration JSON** : réimporte un fichier de sauvegarde (remplace tout, avec confirmation).
- **Export Excel** (Réglages) : génère un `.xlsx` avec 3 feuilles — **Bilan quotidien**,
  **Journal**, **Photos** — colonnes compatibles avec le tableau existant
  (voir `src/utils/excelExport.ts`). Période au choix : 7 jours / 30 jours / tout.

---

## 🧱 Architecture

```
app/
├── index.html                  # point d'entrée, manifest PWA
├── vite.config.ts              # Vite 8 + vite-plugin-pwa (Workbox generateSW)
├── public/                     # icônes PWA (pwa-192/512, favicon, apple-touch-icon)
└── src/
    ├── main.tsx / App.tsx      # onglets Aujourd'hui / Ajouter / Bibliothèque / Historique / Réglages
    ├── types/index.ts          # Food, JournalEntry, DailySummary, MealTemplate, OBJECTIVE_DEFAULT = -500
    ├── db/index.ts             # Dexie/IndexedDB : foods, journal, dailySummaries, mealTemplates
    ├── data/genericFoods.ts    # ~150 aliments génériques hors ligne
    ├── pages/                  # Today, AddFood, Library, History, Settings
    ├── components/             # FoodSelector, BarcodeScanner (@zxing, import dynamique),
    │                           #   FoodForm, QuantityEntry, modales, MealTemplate*
    └── utils/
        ├── calculations.ts     # fonctions pures (testées) : nutrition, tare, sommeil, bilan…
        ├── calculations.test.ts# 34 tests Vitest
        ├── objective.ts        # objectif calorique (localStorage + synchro onglets)
        └── excelExport.ts      # export .xlsx (xlsx, import dynamique)
```

- **Bundle** : ~405 kB total, ~120 kB gzip pour le chunk principal — `xlsx` et `@zxing/library`
  sont chargés en chunks séparés (imports dynamiques) pour ne télécharger la caméra/Excel
  que quand on en a besoin.
- **Hors ligne** : service worker Workbox (`generateSW`, `autoUpdate`) met en cache tout le
  bundle + icônes → l'app fonctionne en mode avion après la première visite.

---

## 🗺 Feuille de route

- **V1 (terminée)** : voir [`PLAN.md`](../PLAN.md) phases 0–18
- **V2 (à venir)** : lecture OCR des étiquettes (tesseract.js) avec contrôle de cohérence
  macros↔kcal, versions datées des recettes, graphiques (poids 7/30 j, macros), alertes
  in-app (pesée manquante, dépense manquante, bilan 15 jours)

## 📄 Licence

Usage personnel — fait maison, 0 €.
