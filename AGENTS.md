# Agent contract

This repository is a guitar practice site. Your job is to add exercises and theory concepts that
are **valid, playable, and non-duplicative**. The human plays every exercise before it is marked
reviewed, so generate honest drafts rather than polished fiction.

## Before writing anything

1. Read `src/lib/schema.ts` — it is the single source of truth for fields, enums and tunings.
2. Read `src/pages/catalog.astro` or list `src/content/` to see what already exists.
3. Read the target track in `src/content/tracks/`.

## Exercise files

Create `src/content/exercises/<slug>.md`. The slug is kebab-case and must be unique.

Required frontmatter:

| Field | Type | Notes |
|---|---|---|
| `title` | string | Unique, plain language |
| `track` | string | id of a file in `src/content/tracks/` |
| `order` | positive int | Position within the track |
| `difficulty` | 1–5 | 1 first steps, 2 getting it, 3 solid, 4 stretch, 5 ambitious |
| `instrument` | `acoustic` / `electric` / `both` | Prefer `acoustic` or `both` while the player owns only a steel-string |
| `tuning` | `standard` / `drop-d` / `half-step-down` / `dadgad` | Must match the tab |
| `technique` | array of `TECHNIQUES` | Controlled vocabulary, see schema |
| `concepts` | array of concept ids | At least one. Create the concept if needed |
| `prereqs` | array of exercise ids | Must exist; no cycles |
| `bpm.start` | int | Where the player starts |
| `bpm.target` | int | Must equal `\tempo` |
| `timeSignature` | string | Must equal `\ts` |
| `goal` | string | One sentence, observable |
| `reviewed` | boolean | **Always `false`** when generating. Only the human flips it |

Body: short prose (`## What it trains`, `## How to practise`) followed by exactly one fenced
```alphatex block.

## alphaTex rules

```
\tempo <bpm.target>
\track "Guitar" { instrument acousticguitarsteel }
\tuning (<string1> <string2> ... <string6>)   // highest string first
\ts (<beats> <unit>)
```

- Fret note: `fret.string`, where string 1 is the thinnest string.
- Chord: `(0.6 2.5).8` — notes together, then the duration.
- Define durations explicitly. Keep every bar complete for the time signature.
- Do not invent metadata tags or instrument names.

### Pick an instrument that matches the frontmatter

`npm run validate` fails if the tab's `instrument` and the frontmatter disagree. Without an
instrument the part falls back to piano, which is never what you want.

| `instrument` | allowed alphaTex instruments |
|---|---|
| `acoustic` | `acousticguitarsteel`, `acousticguitarnylon` |
| `electric` | `electricguitarclean`, `electricguitarjazz`, `electricguitarmuted`, `overdrivenguitar`, `distortionguitar`, `guitarharmonics` |
| `both` | any of the above |

Use `acousticguitarsteel` for the default steel-string voice. Reserve distortion and overdrive
for material that is genuinely about electric tone, and say so in the prose. The machine you are
writing for is an unamplified steel-string; playback is a reference, not a backing track.

## Acoustic constraints

The primary instrument is a steel-string acoustic. Mark genuinely electric-only material as
`instrument: electric` and say why in the prose. Bends, pinch harmonics, tremolo-bar work and
frets above 15 are warnings in the validator; use them rarely and deliberately.

## Validation

Run `npm run validate` and fix everything until it reports **0 errors**. Warnings are acceptable
but should be justified in the prose.

Then, if you have been asked to open a PR:

```sh
git switch -c <short-branch-name>
git add -A
git commit -m "Add <n> exercises for <focus>"
git push -u origin HEAD
gh pr create --fill
```

Never set `reviewed: true`, never edit an existing reviewed exercise without being asked, and
never delete content.
