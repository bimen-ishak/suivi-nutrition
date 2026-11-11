# Graph Report - suivi-nutrition  (2026-11-11)

## Corpus Check
- 95 files · ~75,776 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 32 file(s) not represented in the graph (top: .css 27, (none) 2, .webmanifest 2)
- WARNING: 32 of 147 files seen (22%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 599 nodes · 1894 edges · 18 communities (16 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `496deab7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- types/index.ts
- Settings and AI imports
- t
- BulkSettings.tsx
- GitHub Pages deployment
- Development dependencies
- App TypeScript settings
- Tooling TypeScript settings
- Runtime dependencies
- db/index.ts
- cut.ts
- excelExport.ts
- Development commands
- Build and offline caching
- Code quality rules
- TypeScript project references
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `t()` - 89 edges
2. `unitLabel()` - 38 edges
3. `Today()` - 36 edges
4. `react` - 33 edges
5. `Settings()` - 29 edges
6. `ti()` - 29 edges
7. `locale()` - 29 edges
8. `History()` - 29 edges
9. `vitest` - 27 edges
10. `BulkPage()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Today()` --indirect_call--> `getPinnedCutMetrics()`  [INFERRED]
  app/src/pages/Today.tsx → app/src/utils/cutDashboard.ts
- `App()` --calls--> `BulkPage()`  [EXTRACTED]
  app/src/App.tsx → app/src/bulk/BulkPage.tsx
- `BulkPage()` --calls--> `Icon()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/components/Icon.tsx
- `BulkPage()` --calls--> `WeeklySummary()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/components/WeeklySummary.tsx
- `BulkPage()` --calls--> `locale()`  [EXTRACTED]
  app/src/bulk/BulkPage.tsx → app/src/i18n/index.ts

## Import Cycles
- None detected.

## Communities (18 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.17
Nodes (16): App(), ICONS, Navigation(), NavigationProps, NavigationTab, SettingsGroup(), ToastHost(), initialMode (+8 more)

### Community 1 - "types/index.ts"
Cohesion: 0.06
Nodes (84): AdvancedCalculationModal(), AdvancedCalculationModalProps, BarcodeScanner(), BarcodeScannerProps, EditJournalModalProps, FoodCard(), FoodCardProps, FoodForm() (+76 more)

### Community 2 - "Settings and AI imports"
Cohesion: 0.07
Nodes (53): describe(), LabelScanButton(), LabelScanButtonProps, exportAllData(), getAllDailySummaries(), getAllJournalEntries(), importAllData(), importHistory() (+45 more)

### Community 3 - "t"
Cohesion: 0.08
Nodes (54): CalorieRing(), CalorieRingProps, DailySummaryModal(), DailySummaryModalProps, EditJournalModal(), Icon(), MacroCard(), MacroCardProps (+46 more)

### Community 4 - "BulkSettings.tsx"
Cohesion: 0.06
Nodes (79): analysePhotos(), clearApiKey(), clearOpenRouterKey(), getActiveKey(), getApiKey(), getOpenRouterKey(), getProvider(), read() (+71 more)

### Community 5 - "GitHub Pages deployment"
Cohesion: 0.06
Nodes (34): defaults, runs-on, steps, concurrency, cancel-in-progress, group, run, environment (+26 more)

### Community 6 - "Development dependencies"
Cohesion: 0.10
Nodes (25): devDependencies, fake-indexeddb@^6.2.8, jsdom@^31.0.0, oxlint@^1.90.0, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.8, @types/node@^24.19.2, @types/react@^19.3.0 (+17 more)

### Community 7 - "App TypeScript settings"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 8 - "Tooling TypeScript settings"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 9 - "Runtime dependencies"
Cohesion: 0.20
Nodes (10): dependencies, dexie@^4.4.7, @fontsource-variable/instrument-sans@^5.3.0, react@^19.3.1, react-dom@^19.3.1, xlsx@^0.18.5, @zxing/library@^0.23.0, @fontsource-variable/instrument-sans (+2 more)

### Community 10 - "db/index.ts"
Cohesion: 0.11
Nodes (19): MONTH_START(), PhotoCalendar(), PhotoCalendarProps, addJournalEntry(), db, deletePhoto(), getAllPhotos(), incrementFoodFrequency() (+11 more)

### Community 11 - "cut.ts"
Cohesion: 0.11
Nodes (42): CutCard(), dateDaysAgo(), number(), RANGES, signed(), dayNumber(), kg(), PAD (+34 more)

### Community 12 - "excelExport.ts"
Cohesion: 0.36
Nodes (6): BilanRow, exportToExcel(), formatFoodName(), formatQuantity(), loadXLSX(), XLSXModule

### Community 13 - "Development commands"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:run, test:ui

### Community 14 - "Build and offline caching"
Cohesion: 0.20
Nodes (7): vite-plugin-pwa@^2.0.0, vite@^8.3.6, @vitejs/plugin-react@^6.1.2, __dirname, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 16 - "Code quality rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `types/index.ts` to `react`, `Settings and AI imports`, `t`, `BulkSettings.tsx`, `db/index.ts`, `cut.ts`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0581039755351682 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `types/index.ts`, `Settings and AI imports`, `t`, `BulkSettings.tsx`, `Development dependencies`, `Runtime dependencies`, `db/index.ts`, `cut.ts`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `Settings and AI imports` be split into smaller, more focused modules?**
  _Cohesion score 0.07281772953414745 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `BulkSettings.tsx` to `react`, `types/index.ts`, `Settings and AI imports`, `t`, `Development dependencies`, `cut.ts`, `Build and offline caching`, `@testing-library/jest-dom`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `t` be split into smaller, more focused modules?**
  _Cohesion score 0.0770735524256651 - nodes in this community are weakly interconnected._
- **Should `BulkSettings.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0629004076878276 - nodes in this community are weakly interconnected._