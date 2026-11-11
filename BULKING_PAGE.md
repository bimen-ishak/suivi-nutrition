# Bulking workspace — first version

Built locally on 10 November 2026 in Desktop/suivi-nutrition. No commit, push or deployment was made.

## What is ready

- A simple Arabic/French dashboard showing eaten calories, protein, carbs and fat. Sugar is optional and shows only recorded values.
- Starting targets supplied by the user: **2,800 kcal and 140 g protein**. Both can be changed in Settings.
- Manual meal logging with quantity and values per 100 g/ml, immediate portion totals, editing and deletion.
- Photo-based meal entry: up to three selected images, consumed quantity and preparation notes are included in the requested analysis. Results populate editable fields; saving an AI result requires review confirmation. There is no automatic upload or automatic save.
- A repeat-meal shortcut that opens a previous meal for review rather than logging it immediately.
- Local history with date selection, including corrections to previous days, and a daily-summary CSV export.
- A dedicated JSON backup/restore format including bulking meals and goals. Invalid or incompatible backups are rejected before replacement. AI credentials are excluded.
- Separate bulking database (`NutritionBulkDB`), goals and AI credentials. The original cutting database (`NutritionDB`) is retained. A mode switch exposes both workspaces. Bulking is the initial workspace unless a saved mode says otherwise.
- Gemini is the default provider in the bulking workspace. Language and visual theme remain shared app preferences. These are local workspaces, not authenticated user accounts or a multi-device sync system.

## What still needs connection

The app is **not connected to Google Sheets**, and it has not read or written the user's existing Google history. Gemini's permission to edit that sheet does not authorize this web app automatically. The target spreadsheet and an appropriate Google authorization/deployment configuration are still needed before implementing and validating direct writes and day updates without duplicates.

Google Drive was found as an available integration for working with Sheets; no connection was confirmed during this task. A chat connector connection would help inspect the sheet but is not, by itself, runtime authorization for the standalone app.

Live photo analysis requires the user's provider API key, configured in bulking Settings. No real photos or keys were sent during development. Existing Gemini chat access is separate from a provider API key.

## Validation

- **177 tests across 16 files passed.** New coverage includes portion math, optional sugar handling, user-supplied targets, cutting/bulking credential separation, invalid backup rejection, CSV round-trip, manual logging/history, explicit photo submission/review and forwarding consumed quantity to both AI providers.
- Production build passed. Lint completed with pre-existing warnings in original screens; no new warnings remained in bulking files. Formatting checks passed.
- Arabic mobile dashboard, editor and settings were inspected at 390 × 844. A screenshot is saved alongside this note. The browser viewport was restored afterward.
- UI workflow tests use an in-memory persistence substitute; real IndexedDB backup/restore and live provider/Google Sheets calls were not tested end to end. Real-iPhone camera and offline-installation checks remain outstanding.
- Graphify updated the map to 517 nodes, 1,549 edges and 18 communities. It remains a structural code map with unsupported file types and semantic document coverage limitations.
