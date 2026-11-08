# Playback sound

`generaluser-gs-2.0.3.sf3` — GeneralUser GS 2.0.3 by S. Christian Collins
(8.7 MB, SF3 / Ogg-compressed SoundFont).

alphaTab synthesises playback from a SoundFont, so this file is what the site
sounds like. alphaTab's bundled Sonivox bank uses 11–32 kHz samples and sounds
like a 1990s MIDI module; GeneralUser GS uses full-rate samples and has much
better guitar, bass and drum patches. See `LICENSE-GeneralUser-GS.txt`.

This directory is tracked by git. Do not put it under `public/soundfont/`:
alphaTab's Vite plugin regenerates that directory from
`node_modules/@coderline/alphatab` on every build, and it is gitignored.

To swap banks, drop an `.sf2`/`.sf3` here and change one line in
`src/components/Player.astro`:

```ts
player: {
  soundFont: `${base}audio/generaluser-gs-2.0.3.sf3`,
}
```

Prefer `.sf3`: same samples as `.sf2` with Ogg compression, so it downloads
faster and sounds identical.

## Instrument vs. SoundFont

The bank decides *sample quality*; the `instrument` in each exercise's alphaTex
decides *which sample*. They are different knobs:

| Track frontmatter | alphaTex instrument | GM program |
|---|---|---|
| `acoustic` | `acousticguitarsteel` | 25 |
| `acoustic` | `acousticguitarnylon` | 24 |
| `electric` | `electricguitarclean` | 27 |
| `electric` | `overdrivenguitar` | 29 |
| `electric` | `distortionguitar` | 30 |
| `both` | any of the above | — |

A missing instrument silently plays as piano, so `npm run validate` requires
one and checks it against the exercise's frontmatter.
