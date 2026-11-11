# Suivi Nutrition — document/code discrepancies

Source: Desktop/suivi-nutrition at commit 496deab7cbd3afec3c9e1c1879764977f3c963b1. Reviewed 10 November 2026.

This is one Elephant & Goldfish drift audit, using two reviewers with fresh conversation contexts and a primary-agent synthesis. Both reviewers completed their assigned document reads and used Graphify before exploring source code. It is not a completed multi-round EGM design-review loop. Reviewer roles came from the Desktop Elephant-Goldfish bundle. Complete exclusion of host instruction files from reviewer context was not independently established.

Evidence paths below are relative to Desktop/suivi-nutrition. Findings are static source observations unless stated otherwise. Priorities reflect practical impact: P1 = fix before relying on the affected result or claim; P2 = reconcile or implement in the improvement backlog; P3 = minor inconsistency. Deferred V2 ideas are not automatically implementation defects.

## SPEC.md

- **S1 / P1 — Unconditional privacy/offline contract conflicts with optional cloud photo analysis.** SPEC lines 5, 12–13 and 696 say no data is sent and operation is entirely offline. `app/src/components/LabelScanButton.tsx:57–68` calls photo analysis; `app/src/utils/aiReader.ts:46–50` selects Gemini/OpenRouter; `app/src/utils/labelReader.ts:211–231` posts image data to Google and requires Internet. This is user-initiated optional analysis, not evidence of background uploads. Document core local tracking separately from the optional upload feature and its providers.

- **S2 / P1 — Editing an old entry can apply a newer food recipe.** SPEC lines 160–163 and 311–312 promise history is never changed by library recipe updates. `app/src/components/EditJournalModal.tsx:28–30,46–59,77–93` loads the current food and recalculates nutrition on save. Updating cereal calories and then correcting only yesterday's meal/time can rewrite yesterday's calories using today's recipe. Stored historical totals survive a library edit only until the entry is edited. Preserve the entry's nutritional snapshot when editing history.

- **S3 / P1 — Excel minerals are under the wrong columns.** SPEC lines 468–481 require I/J empty, potassium in K and sodium in L. `app/src/utils/excelExport.ts:158–171` creates ten-field objects, putting mineral values in I/J; lines 172–176 then write twelve headers, leaving labeled K/L without corresponding values. Use an explicit twelve-column row layout and validate an exported workbook.

- **S4 / P1 — Advanced weights can be interpreted as portion counts.** SPEC lines 99–108 say the result is grams eaten. `app/src/components/QuantityEntry.tsx:36–43` defaults to the first custom portion; lines 83–95 accept an advanced result without switching the unit to grams. `app/src/pages/AddFood.tsx:127–135` then converts it again as portions. A 50g result with a 100g bowl selected becomes 5,000g. Normalize the result's unit and add a regression check for this path.

- **S5 / P2 — Meal templates are claimed complete but lack a user workflow.** SPEC lines 112–131, 234, 269 and 583 describe save/select/adjust/batch-log templates. `app/src/components/FoodSelector.tsx:11,86–111` has frequent/one-off/scan/search modes; `app/src/pages/Library.tsx:15,118–131` has personal/generic tabs; `app/src/pages/AddFood.tsx:111–183` logs one food. The table and type in `app/src/db/index.ts:10,20` and `app/src/types/index.ts:126–138` provide storage, not the promised feature.

- **S6 / P2 — Habit/time suggestions and quick-entry target are overstated.** SPEC lines 80–88, 231, 242 and 580 promise hour-sensitive frequent foods and habitual meal defaults. `app/src/components/FoodSelector.tsx:29–33,115–137` sorts by global frequency; `app/src/components/QuantityEntry.tsx:28` defaults to breakfast. The repeated-scan route also requires Add, Scanner, camera, quantity and confirmation, exceeding the completion target in SPEC lines 7 and 664. Define a realistic interaction measure and implement the missing shortcuts.

- **S7 / P2 — Generic catalog and update mechanism differ.** SPEC lines 298–299 and 591 claim 500 foods and a version/update option. `app/src/data/genericFoods.ts:16–226` contains 182 literal entries; lines 228–237 provide local category/search utilities. `app/src/pages/Settings.tsx:175–463` has no catalog version/update section. The source identifies mixed Ciqual/OpenFoodFacts averages rather than the stated versioned release.

- **S8 / P2 — Unknown mineral values may be estimated.** SPEC lines 325 and 403–409 require unknown potassium to remain empty. `app/src/components/FoodForm.tsx:132–146` and `app/src/components/QuickEntry.tsx:74–82` offer estimated potassium; `app/src/utils/labelReader.ts:22–25` instructs AI to estimate absent minerals. Manual estimation marks source as estimation, but label-mode results use an overall source flag (`FoodForm.tsx:112–117`) rather than per-mineral provenance. Reconcile the requirement and preserve whether each displayed mineral was measured or estimated.

- **S9 / P2 — Documented JSON example does not match the restorable schema.** SPEC lines 507–562 omit required journal IDs and use `sleep` rather than `sleepDuration`. Compare `app/src/types/index.ts:61–96`; `app/src/db/index.ts:53–67` imports directly into an ID-keyed table. The example passes the shallow UI check in `app/src/pages/Settings.tsx:81–86` but fails journal insertion. The restore transaction should roll back; this is not a demonstrated data-loss event. Publish a valid example and validate/migrate supported versions explicitly.

- **S10 / P2 — Complete backup omits the calorie objective.** SPEC lines 286–287, 589 and 666 promise all-data/lossless restoration. `app/src/utils/objective.ts:3,9–20` keeps the objective in localStorage, while `app/src/db/index.ts:31–50,53–79` only exports/restores database tables. A fresh-device restore loses the customized objective. Include user settings or clearly define the backup boundary; credentials need not be included.

- **S11 / P2 — Undefined portions cannot be defined while logging.** SPEC lines 135–146 and 314–315 describe an unknown-unit weight prompt. `app/src/components/QuantityEntry.tsx:45–59,154–164` only offers g/ml and existing portions. Definitions must be made separately in `app/src/components/FoodForm.tsx:447–514`.

- **S12 / P2 — History navigation is limited to 30 days with data.** SPEC lines 248–255 describe a date selector/calendar. `app/src/pages/History.tsx:43–50,64–77,376–416` builds a recent list, preventing selection of older stored dates or empty dates for daily-summary correction.

- **S13 / P2 — Implemented weight analysis follows a different model.** SPEC lines 367–376 describe cumulative expenditure deficit, theoretical loss and water-retention explanations. `app/src/utils/cut.ts:57–68,92–134` uses measured-weight averages/slopes and intake-based maintenance estimates; `app/src/components/CutCard.tsx:58–67,95–183` presents those results. The seven-day average exists; the additional specified model does not. Choose the intended scope before implementing speculative health explanations.

- **S14 / P2 — Manual expenditure entry only accepts a total.** SPEC lines 344–348 require rest/activity inputs and summation. `app/src/components/DailySummaryModal.tsx:15–20,33–46,62–85` exposes the total/provisional flag only. It also reconstructs the summary without the optional component fields defined in `app/src/types/index.ts:89–90`.

- **S15 / P2 — Estimate provenance is not consistently displayed.** SPEC lines 75, 195–199 and 318 require visible estimate markings before logging and in the journal. `app/src/components/QuantityEntry.tsx:134–225`, `app/src/pages/Today.tsx:392–424` and `app/src/pages/History.tsx:323–351` do not render the stored food source. The journal still stores it (`AddFood.tsx:145–147`).

- **S16 / P2 — Third Excel sheet differs from the specification.** SPEC lines 483–497 describe a populated food-library sheet. `app/src/utils/excelExport.ts:63–67,184–192` instead produces an empty Photos sheet. The README agrees with the current three-sheet names, so this is an unresolved document contract, not a reason to silently change the workbook format.

- **S17 / P3 — Today order and difference-mode behavior diverge.** SPEC line 214 says newest first; `app/src/db/index.ts:137–138` sorts ascending and `app/src/pages/Today.tsx:375–392` groups/render entries without reversing. SPEC line 101 describes before-minus-after, while `app/src/components/AdvancedCalculationModal.tsx:47–51` uses absolute difference, allowing a positive result where the note can describe a negative subtraction.

## PLAN.md

- **P1 / P2 — Roadmap status is obsolete.** Lines 36–50 and 1016–1019 leave conception/V1 development ahead, despite implementation in `app/src/pages/AddFood.tsx:111–180`, `Today.tsx:271–442`, `History.tsx:40–87`, `Settings.tsx:37–97,159–173` and `.github/workflows/deploy.yml:17–45`. Lines 1027–1029 tell later sessions to use the plan to choose work, creating a risk of duplicate implementation.

- **P2 / P2 — Meal-template phase is unfinished.** Lines 462–481 require save/select/adjust/batch-log behavior; see S5 for the missing interface and storage-only implementation.

- **P3 / P2 — Generic-library architecture differs.** Lines 629–650 call for approximately 500 foods seeded into IndexedDB. The actual bundled array is read by `app/src/components/FoodSelector.tsx:45–58`, and individual foods enter storage when selected (`app/src/pages/AddFood.tsx:43–68`). `app/src/pages/Library.tsx:25–28,97–106` filters saved foods, so its Generics tab does not show the entire bundled catalog on a new installation.

- **P4 / P1 — Excel compatibility requirement is not met.** Lines 703–708 require blank I/J and minerals in K/L; see S3. Dates are also emitted as ISO strings (`app/src/utils/excelExport.ts:127,159`), rather than converted to Excel date cells as planned. Validate the receiving spreadsheet's expected date representation.

- **P5 / P2 — History navigation differs.** Lines 601–618 specify a date selector and previous/next controls; see S12 for the recent-data-only implementation.

- **P6 / P2 — A planned balance example has incorrect arithmetic.** Line 515 expects 200 kcal more to burn for 2,200 burned, 2,500 eaten and a 500 deficit. `app/src/utils/calculations.ts:98–110` correctly yields 800, as used by `app/src/pages/Today.tsx:124–135`. Correct the example rather than changing the formula to match it.

- **P7 / P2 — Photo-reading roadmap does not distinguish cloud analysis from offline OCR.** Lines 838–861 describe future Tesseract OCR. Current `app/src/components/FoodForm.tsx:217`, `LabelScanButton.tsx:57–66` and `app/src/utils/aiReader.ts:47–50` already integrate cloud photo analysis. Separate shipped cloud functionality from any still-planned offline recognition, confidence and coherence checks.

## PROGRESS.md

- **G1 / P2 — Next-action instructions are several implemented phases behind.** Lines 41–52 leave Phase 3 in progress and direct the next session to integrate food creation in Phase 4. That integration exists in `app/src/pages/AddFood.tsx:87–109,220–239`, saving in lines 111–180, and navigation in `app/src/App.tsx:18–23`. Backup, Excel and deployment also exist. Replace obsolete resumption guidance with verified remaining work and outstanding validation.

## app/README.md

- **R1 / P1 — Absolute offline/privacy claims omit optional cloud uploads.** Lines 3–8 say no external API/account and all data stays on-device. See S1. `app/src/utils/openRouterReader.ts:28–60` also sends image-bearing requests to OpenRouter. Explain which flows work offline and what leaves the device when analysis is requested.

- **R2 / P2 — Completed meal templates and associated components are advertised without the workflow.** Lines 17 and 147 promise one-click save/replay and finished V1; lines 128–129 refer to `MealTemplate*` components. See S5 for the current selector, library and database implementation.

- **R3 / P1 — Spreadsheet compatibility claim conflicts with mineral layout.** Lines 9 and 109–111 promise compatibility; see S3. This is the same defect, not an additional independent issue.

- **R4 / P2 — Hosting instructions omit the required base path and existing Actions deployment.** Lines 69–74 suggest arbitrary repository/root-domain hosting, but `app/vite.config.ts:10,24–25` fixes asset base, manifest scope and start URL to `/suivi-nutrition/`. Root-domain hosting needs configuration changes. `.github/workflows/deploy.yml:3–6,17–45` already deploys via Pages Actions on main, unlike the branch/folder process described.

- **R5 / P2 — Restore and all-data backup boundaries are inaccurate.** Lines 105–108 imply all data is backed up and everything replaced. See S10 for the excluded objective. `app/src/db/index.ts:69–78` intentionally retains existing photos/imported history when those properties are absent from an older backup. Document that compatibility behavior and test it.

- **R6 / P2 — Screen and feature inventory is stale.** Lines 15–21 and 123 present Add as a tab and omit Photos. `app/src/components/Navigation.tsx:54–60` lists Today/History/Photos/Library/Settings; `app/src/App.tsx:18–29` opens Add separately. Settings also has language, theme and AI provider options (`Settings.tsx:12–31`); Today has Health text import (`Today.tsx:172–197,344–350`); History includes the cut tracker (`History.tsx:368`). These user-visible features lack corresponding current documentation.

- **R7 / P2 — Roadmap defers functionality that has partly shipped.** Lines 148–150 defer label reading and weight charts, while `app/src/components/CutCard.tsx:23–26,74–85,111–114` and `WeightChart.tsx:47–86` implement weight charts and selectable ranges. Cloud label analysis also exists (S1). Keep remaining offline OCR, dated recipes and macro charts separate from shipped portions.

- **R8 / P3 — Add-screen calculation description includes sleep incorrectly.** Line 18 lists sleep among advanced food calculations; `app/src/components/AdvancedCalculationModal.tsx:93–111` offers tare, remaining and difference only. Sleep belongs to daily-summary entry.

## Review coverage and limits

- SPEC reviewer: completed the full SPEC, required workflow/persona/integration and project instructions; read the relevant production pages, food/scanning/editing components, database/types, calculation/AI/export/objective utilities, configuration and test setup. Some source reads were focused ranges. The generic-food count was checked, but individual nutrient values were not audited. Required historical-edit/integration tests were not conclusively audited across every test file.
- Documentation reviewer: completed PLAN, PROGRESS and app/README, required workflow/persona/integration and project instructions; compared source and deployment references above. Both reviewers reported completion; neither edited files or invoked external AI services.
- The primary agent independently inspected database/backup, types, Excel export, settings, historical edit, advanced quantity handling and photo-upload code to verify the highest-impact findings.
- No functional app code was changed. No real user data, provider keys or photos were uploaded. No iPhone, camera, offline-installation, restore or exported-workbook runtime test was performed during this audit.
- Earlier in this chat, the unchanged checkout passed 160 tests and a production build; lint completed with warnings. Those baseline checks do not establish the missing interaction-level guarantees identified here. They were not rerun for generated documentation/map changes.
