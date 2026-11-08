---
description: Draft new guitar exercises and validate them
---

You are adding content to the guitar practice site in the current repository.

Read `AGENTS.md` first, then the schemas in `src/lib/schema.ts` and the existing content in
`src/content/`.

Request: $ARGUMENTS

Steps:

1. Check the catalog/existing files so you do not duplicate an exercise or concept.
2. Create the exercise files and any missing concept files.
3. Run `npm run validate` and fix every error. Re-run until it reports 0 errors.
4. Summarise what you added, including any validator warnings and why they are acceptable.
5. If asked to open a PR, branch, commit and run `gh pr create --fill`.

Leave `reviewed: false` on every new exercise.
