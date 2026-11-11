# Graph Report - suivi-nutrition  (2026-11-11)

## Corpus Check
- 94 files · ~74,590 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 32 file(s) not represented in the graph (top: .css 27, (none) 2, .webmanifest 2)
- WARNING: 32 of 146 files seen (22%) have no supported extractor and are missing from this graph entirely. It may look complete while representing only part of the codebase.

## Summary
- 591 nodes · 1863 edges · 19 communities (17 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
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
- coverage.test.ts
- @testing-library/jest-dom

## God Nodes (most connected - your core abstractions)
1. `t()` - 87 edges
2. `unitLabel()` - 36 edges
3. `Today()` - 36 edges
4. `react` - 32 edges
5. `Settings()` - 29 edges
6. `ti()` - 29 edges
7. `History()` - 29 edges
8. `locale()` - 27 edges
9. `vitest` - 27 edges
10. `BulkPage()` - 25 edges

## Surprising Connections (you probably didn't know these)
- `BarcodeScannerProps` --references--> `Food`  [EXTRACTED]
  app/src/components/BarcodeScanner.tsx → app/src/types/index.ts
- `Today()` --indirect_call--> `getPinnedCutMetrics()`  [INFERRED]
  app/src/pages/Today.tsx → app/src/utils/cutDashboard.ts
- `App()` --calls--> `BulkPage()`  [EXTRACTED]
  app/src/App.tsx → app/src/bulk/BulkPage.tsx
- `App()` --calls--> `t()`  [EXTRACTED]
  app/src/App.tsx → app/src/i18n/index.ts
- `App()` --calls--> `AddFood()`  [EXTRACTED]
  app/src/App.tsx → app/src/pages/AddFood.tsx

## Import Cycles
- None detected.

## Communities (19 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.11
Nodes (28): App(), ICONS, Navigation(), NavigationProps, NavigationTab, MONTH_START(), PhotoCalendar(), PhotoCalendarProps (+20 more)

### Community 1 - "types/index.ts"
Cohesion: 0.07
Nodes (55): AdvancedCalculationModal(), AdvancedCalculationModalProps, EditJournalModalProps, FoodCardProps, FoodForm(), FoodFormProps, FormState, FoodSelectorProps (+47 more)

### Community 2 - "Settings and AI imports"
Cohesion: 0.08
Nodes (50): describe(), LabelScanButton(), LabelScanButtonProps, exportAllData(), getAllDailySummaries(), getAllJournalEntries(), importAllData(), importHistory() (+42 more)

### Community 3 - "t"
Cohesion: 0.09
Nodes (61): BarcodeScanner(), BarcodeScannerProps, CalorieRing(), CalorieRingProps, DailySummaryModal(), EditJournalModal(), FoodCard(), FoodSelector() (+53 more)

### Community 4 - "BulkSettings.tsx"
Cohesion: 0.07
Nodes (75): analysePhotos(), clearApiKey(), clearOpenRouterKey(), getActiveKey(), getApiKey(), getOpenRouterKey(), getProvider(), read() (+67 more)

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
Nodes (9): dependencies, dexie@^4.4.7, @fontsource-variable/instrument-sans@^5.3.0, react@^19.3.1, react-dom@^19.3.1, @zxing/library@^0.23.0, @fontsource-variable/instrument-sans, react-dom (+1 more)

### Community 10 - "db/index.ts"
Cohesion: 0.09
Nodes (17): DailySummaryModalProps, addJournalEntry(), db, incrementFoodFrequency(), NutritionDatabase, DayData, BackupData, CutHistoryDay (+9 more)

### Community 11 - "cut.ts"
Cohesion: 0.10
Nodes (45): CutCard(), dateDaysAgo(), number(), RANGES, signed(), dayNumber(), kg(), PAD (+37 more)

### Community 12 - "excelExport.ts"
Cohesion: 0.27
Nodes (8): xlsx@^0.18.5, BilanRow, exportToExcel(), formatFoodName(), formatQuantity(), loadXLSX(), XLSXModule, xlsx

### Community 13 - "Development commands"
Cohesion: 0.25
Nodes (8): scripts, build, dev, lint, preview, test, test:run, test:ui

### Community 14 - "Build and offline caching"
Cohesion: 0.20
Nodes (7): vite-plugin-pwa@^2.0.0, vite@^8.3.6, @vitejs/plugin-react@^6.1.2, __dirname, vite, vite-plugin-pwa, @vitejs/plugin-react

### Community 16 - "Code quality rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 18 - "coverage.test.ts"
Cohesion: 0.21
Nodes (8): AR, ArabicEntry, AR_FOODS, sourceFiles, SOURCES, unescape(), usedKeys(), EN

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `t()` connect `t` to `react`, `types/index.ts`, `Settings and AI imports`, `BulkSettings.tsx`, `cut.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1076923076923077 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `types/index.ts`, `Settings and AI imports`, `t`, `BulkSettings.tsx`, `Development dependencies`, `Runtime dependencies`, `cut.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Should `types/index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07459505541346974 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `BulkSettings.tsx` to `react`, `types/index.ts`, `Settings and AI imports`, `t`, `Development dependencies`, `db/index.ts`, `cut.ts`, `Build and offline caching`, `coverage.test.ts`, `@testing-library/jest-dom`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `Settings and AI imports` be split into smaller, more focused modules?**
  _Cohesion score 0.07834101382488479 - nodes in this community are weakly interconnected._
- **Should `t` be split into smaller, more focused modules?**
  _Cohesion score 0.09153869316470943 - nodes in this community are weakly interconnected._