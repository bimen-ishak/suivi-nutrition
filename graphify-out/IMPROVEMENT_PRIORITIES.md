# Suivi Nutrition — recommended next work

The Graphify code map and one Elephant & Goldfish drift audit are complete. The audit compared SPEC.md, PLAN.md, PROGRESS.md and app/README.md with the current code. Two independent reviewers completed their assignments; their findings were deduplicated and the most consequential paths checked by the primary agent. The first four fixes below have now been implemented; see PRIORITY_FIXES.md for changes, verification and legacy-entry limitations.

## First fixes — completed

1. **Correct advanced quantity units.** Applying an advanced weight result while a custom portion is selected can multiply a gram result as if it were a portion count. Regression example: a 50g result must remain 50g when a 100g bowl was selected.
2. **Protect historical nutrition when editing old entries.** Editing only a meal/time must preserve its original recipe values, even if the library food changed later. Decide how quantity edits use the historical snapshot.
3. **Repair and verify Excel columns.** Place mineral values in K/L with I/J empty. Export a workbook with distinct potassium/sodium values and inspect the actual cells. Confirm the intended third sheet and receiving workbook's date format.
4. **Make the privacy description accurate.** Core tracking is local/offline; optional AI photo analysis sends selected images to Gemini or OpenRouter and requires connectivity and a provider key. Document those boundaries clearly.

## Then reconcile the product plan

- Restore or explicitly defer meal templates; storage types alone are not a working feature.
- Include the calorie objective in backup/restoration, define legacy-backup behavior and validate supported schemas.
- Update progress/roadmap documents to stop directing future work toward already implemented features.
- Decide scope for time-based food suggestions, generic-library visibility, older-day history access and estimate provenance.
- Reconcile specification examples with the actual catalog (182 foods), shipped photo/weight features and deployment path.

## Deliverables and boundaries

The Desktop project now contains `graphify-out/` (map/report/data), `.codex/` (project Graphify integration), `AGENTS.md` (graph-first guidance) and the dated drift report. These are working-tree additions, not commits or a deployment. The integration hook is Graphify's Codex guidance hook, not a new commit hook.

The map contains 466 nodes, 1,323 edges and 18 named communities from 64 supported code/config files. Documents and images were excluded from automated graph extraction; the four project documents were reviewed separately. CSS and other unsupported files are absent (26 files), and eight scanned files yielded no symbols. Graph extraction used zero model API tokens; reviewer work is separate and its token usage is not exposed by the subagent results.

The most connected items include translation helpers, Today, Settings and History. Food inputs and database operations converge on the Food model. A useful next graph question is how changing food data propagates into historical journal editing and Excel export; the audit found that this path needs particular care.

This is a static audit and an improvement order, not proof that every app behavior is correct. Earlier baseline: 160 tests and production build passed, with lint warnings. No app code was changed, and no iPhone/offline/camera or full backup/workbook runtime validation was performed in this pass.
