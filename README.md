# Guitar Practice

A practice companion for acoustic guitar, built towards rock, punk and metal. Exercises are
plain Markdown with an [alphaTex](https://www.alphatab.net/docs/alphatex/introduction) tab block;
the site renders and plays them in the browser with [alphaTab](https://www.alphatab.net/).

Live site: <https://chrisnhr.github.io/guitar-practice/>

## Commands

```sh
npm install
npm run dev        # local dev server
npm run validate   # schema + alphaTex + musical lint
npm run build      # static build into dist/
npm run check      # validate, then build
```

`npm run validate` is the gate that keeps agent-generated content honest. It checks:

- frontmatter against the Zod schemas in `src/lib/schema.ts`
- that the alphaTex parses, using alphaTab's own importer
- that `\tempo`, `\ts` and `\tuning` match the frontmatter
- frets 0–24, valid string numbers, and no prerequisite cycles
- acoustic-specific warnings (high frets, bends, harmonics, tremolo bar)
- duplicate titles and unknown references

## Content layout

```
src/content/
  exercises/<slug>.md     # frontmatter + prose + ```alphatex block
  concepts/<slug>.md      # one theory idea
  tracks/<slug>.yaml      # ordered curriculum
```

An exercise looks like this:

```markdown
---
title: Low-E Power Chord Chug
track: first-sound
order: 1
difficulty: 2
instrument: both
tuning: standard
technique: [downpicking, chord-change]
concepts: [power-chords, note-names-low-e]
prereqs: []
bpm: { start: 60, target: 100 }
timeSignature: "4/4"
goal: "Move an E5 shape between E, G and A without losing the pulse."
reviewed: false
---

## How to practise

...

```alphatex
\tempo 100
\track "Guitar" { instrument distortionguitar }
\tuning (E4 B3 G3 D3 A2 E2)
\ts (4 4)
(0.6 2.5).8 (0.6 2.5).8 (0.6 2.5).8 (0.6 2.5).8 |
```
```

## Deploying

The site is live at <https://chrisnhr.github.io/guitar-practice/>.

### Current method: `gh-pages` branch

GitHub Actions is unavailable on this account right now (GitHub reports
*"your account is locked due to a billing issue"*), so the site is deployed by
building locally and force-pushing `dist/` to the `gh-pages` branch:

```sh
npm run deploy     # validate + build + push dist/ to gh-pages
```

Pages is configured as **Settings → Pages → Source: Deploy from a branch →
`gh-pages` / `/`**. The script writes `dist/.nojekyll`, which is required:
without it Jekyll drops the `_astro/` directory and the site loses its CSS and JS.

### Going back to Actions

Once the billing issue is resolved:

1. Re-enable the `push` trigger in `.github/workflows/deploy.yml`.
2. Set **Settings → Pages → Source** to **GitHub Actions**.
3. Push to `main`.

If you change the repository name, update `base` in `astro.config.mjs` (and `site`) to match.
alphaTab's font and SoundFont URLs are derived from `import.meta.env.BASE_URL`, so a wrong
`base` shows up as an empty tab that plays nothing.

## Writing content with an agent

See `AGENTS.md`. In short: ask for exercises, let the agent run `npm run validate`, then play
them and flip `reviewed: true` before merging.
