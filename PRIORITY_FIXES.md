# First-priority fixes — completed 10 November 2026

Implemented in the Desktop `suivi-nutrition` checkout. No changes have been committed, pushed or deployed.

- **Advanced weights:** tare, remaining and difference results switch the quantity unit to grams, preventing a selected custom portion from multiplying the result again.
- **Historical entries:** new food log entries save their recipe and portion definitions. Historical editing uses saved values instead of the current food library. Changing only time or meal preserves exact stored nutrients. Older entries scale their existing totals; older custom portions remain editable in their original unit because their original gram weights cannot safely be recovered. One-off foods use their existing saved nutrition. Changing quantity or unit also clears an obsolete advanced-calculation note.
- **Excel:** Journal exports now use explicit A–L rows, leaving I/J empty and putting potassium/sodium in K/L. Known zero and unknown mineral values remain distinguishable. The existing three worksheet names are preserved.
- **Privacy:** the photo-analysis screen identifies the destination and Internet requirement before upload. Settings, README and SPEC distinguish local manual tracking from optional cloud photo analysis. New interface copy includes Egyptian Arabic translations. No AI photos were transmitted during development or checks.

## Verification

- All **168 tests across 12 files passed**, including eight new regression cases: three advanced-weight modes, four historical-edit scenarios and an Excel workbook round-trip.
- The workbook check serializes and reads an actual XLSX workbook and verifies nutrient headers/data in K/L, blank I/J, known zero and unknown values.
- Production build passed. Lint completed without errors; existing warnings elsewhere remain. Formatting checks passed.
- The updated local app was opened and its revised Settings disclosure verified. The preview needed a restart to load current source.
- Graphify refreshed the code map to **472 nodes, 1,348 edges and 19 communities**. It remains a structural code map; documents/images and unsupported file types are outside its automated coverage.

The dated drift report is a historical record of the pre-fix audit. Its S1–S4/R1/R3 findings are addressed by this change, while its broader product and documentation backlog remains for discussion. Real-iPhone camera/offline-installation checks and a comprehensive backup/restore test were outside this pass.
