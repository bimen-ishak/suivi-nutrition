# Graph Report - suivi-nutrition  (2026-11-10)

## Corpus Check
- 84 files · ~64,898 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .css 26, (none) 2, .example 1)
- WARNING: 29 of 129 files seen (22%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 561 nodes · 1714 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `496deab7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- db/index.ts
- Food library and entry
- Settings and AI imports
- db/index.ts
- BulkSettings.tsx
- GitHub Pages deployment
- Development dependencies
- App TypeScript settings
- Tooling TypeScript settings
- Runtime dependencies
- Test setup
- cut.ts
- Excel export
- Development commands
- Build and offline caching
- health.ts
- Code quality rules
- TypeScript project references

## God Nodes (most connected - your core abstractions)
1. `t()` - 82 edges
2. `unitLabel()` - 36 edges
3. `Today()` - 35 edges
4. `react` - 30 edges
5. `ti()` - 29 edges
6. `Settings()` - 26 edges
7. `History()` - 25 edges
8. `vitest` - 23 edges
9. `BulkSettings()` - 22 edges
10. `locale()` - 22 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `BulkPage()`  [EXTRACTED]
  app/src/App.tsx → app/src/bulk/BulkPage.tsx
- `BulkPage()` --calls--> `locale()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/i18n/index.ts
- `BulkPage()` --calls--> `t()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/i18n/index.ts
- `BulkPage()` --calls--> `unitLabel()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/i18n/index.ts
- `BulkPage()` --calls--> `localDateKey()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/utils/photo.ts

## Import Cycles
- None detected.

## Communities (18 total, 2 thin omitted)

### Community 0 - "db/index.ts"
Cohesion: 0.13
Nodes (46): CalorieRing(), CalorieRingProps, DailySummaryModal(), DailySummaryModalProps, EditJournalModal(), FoodCard(), FoodSelector(), DROPPED (+38 more)

### Community 1 - "Food library and entry"
Cohesion: 0.05
Nodes (62): AdvancedCalculationModal(), AdvancedCalculationModalProps, BarcodeScanner(), BarcodeScannerProps, FoodCardProps, FoodForm(), FoodFormProps, FormState (+54 more)

### Community 2 - "Settings and AI imports"
Cohesion: 0.07
Nodes (51): describe(), LabelScanButton(), LabelScanButtonProps, exportAllData(), getAllDailySummaries(), getAllJournalEntries(), importAllData(), importHistory() (+43 more)

### Community 3 - "db/index.ts"
Cohesion: 0.07
Nodes (44): App(), ICONS, Navigation(), NavigationProps, NavigationTab, MONTH_START(), PhotoCalendar(), PhotoCalendarProps (+36 more)

### Community 4 - "BulkSettings.tsx"
Cohesion: 0.07
Nodes (69): analysePhotos(), clearApiKey(), clearOpenRouterKey(), getActiveKey(), getApiKey(), getOpenRouterKey(), getProvider(), read() (+61 more)

### Community 5 - "GitHub Pages deployment"
Cohesion: 0.06
Nodes (34): defaults, runs-on, steps, concurrency, cancel-in-progress, group, run, environment (+26 more)

### Community 6 - "Development dependencies"
Cohesion: 0.10
Nodes (26): devDependencies, fake-indexeddb@^6.2.8, jsdom@^31.0.0, oxlint@^1.90.0, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.8, @types/node@^24.19.2, @types/react@^19.3.0 (+18 more)

### Community 7 - "App TypeScript settings"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "Tooling TypeScript settings"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Runtime dependencies"
Cohesion: 0.22
Nodes (9): dependencies, dexie@^4.4.7, @fontsource-variable/instrument-sans@^5.3.0, react@^19.3.1, react-dom@^19.3.1, xlsx@^0.18.5, @zxing/library@^0.23.0, @fontsource-variable/instrument-sans (+1 more)

### Community 11 - "cut.ts"
Cohesion: 0.11
Nodes (41): CutCard(), dateDaysAgo(), number(), RANGES, signed(), dayNumber(), kg(), PAD (+33 more)

### Community 12 - "Excel export"
Cohesion: 0.26
Nodes (9): EditJournalModalProps, JournalEntry, BilanRow, exportToExcel(), formatFoodName(), formatQuantity(), loadXLSX(), XLSXModule (+1 more)

### Community 13 - "Development commands"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:run, test:ui

### Community 14 - "Build and offline caching"
Cohesion: 0.20
Nodes (7): vite-plugin-pwa@^2.0.0, vite@^8.3.6, @vitejs/plugin-react@^6.1.2, __dirname, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 15 - "health.ts"
Cohesion: 0.39
Nodes (6): applyHealthToSummary(), FIELDS, HealthData, parseHealthText(), readDate(), readNumber()

### Community 16 - "Code quality rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `db/index.ts` to `Food library and entry`, `Settings and AI imports`, `db/index.ts`, `BulkSettings.tsx`, `cut.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Should `db/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1318181818181818 - nodes in this community are weakly interconnected._
- **Why does `react` connect `db/index.ts` to `db/index.ts`, `Food library and entry`, `Settings and AI imports`, `BulkSettings.tsx`, `Development dependencies`, `Runtime dependencies`, `cut.ts`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **Should `Food library and entry` be split into smaller, more focused modules?**
  _Cohesion score 0.05480277024992472 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Settings and AI imports` to `db/index.ts`, `Food library and entry`, `db/index.ts`, `BulkSettings.tsx`, `Development dependencies`, `Test setup`, `cut.ts`, `Excel export`, `Build and offline caching`, `health.ts`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Settings and AI imports` be split into smaller, more focused modules?**
  _Cohesion score 0.07459207459207459 - nodes in this community are weakly interconnected._
- **Should `db/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06993006993006994 - nodes in this community are weakly interconnected._