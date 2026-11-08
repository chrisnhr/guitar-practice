import { z } from 'zod';

/**
 * Shared content schemas.
 *
 * These are imported by `src/content.config.ts` (Astro) and by
 * `scripts/validate.ts` (CI), so there is exactly one definition of what a
 * valid exercise / concept / track looks like.
 */

export const INSTRUMENTS = ['acoustic', 'electric', 'both'] as const;

/**
 * String tunings, written highest string first (string 1 -> string 6), using
 * the same note notation as alphaTex. Keep this in sync with `\tuning`.
 */
export const TUNINGS = {
  standard: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'],
  'drop-d': ['E4', 'B3', 'G3', 'D3', 'A2', 'D2'],
  'half-step-down': ['Eb4', 'Bb3', 'Gb3', 'Db3', 'Ab2', 'Eb2'],
  dadgad: ['D4', 'A3', 'G3', 'D3', 'A2', 'D2'],
} as const;

export const TUNING_NAMES = ['standard', 'drop-d', 'half-step-down', 'dadgad'] as const;
export type TuningName = (typeof TUNING_NAMES)[number];

/**
 * Controlled vocabulary for techniques. An exercise may only use these, so
 * filters and the acoustic-hard warnings stay reliable.
 */
export const TECHNIQUES = [
  'alternate-picking',
  'downpicking',
  'palm-mute',
  'legato',
  'string-skipping',
  'string-crossing',
  'bend',
  'vibrato',
  'pinch-harmonic',
  'tremolo-picking',
  'tremolo-bar',
  'chord-change',
  'strumming',
  'fingerpicking',
] as const;

export type Technique = (typeof TECHNIQUES)[number];

/**
 * alphaTex instrument names, grouped by the frontmatter `instrument` field.
 *
 * Playback timbre is chosen by the tab, not by the SoundFont, so these two
 * must agree. A missing instrument silently falls back to piano, which is why
 * the validator requires one.
 */
const ACOUSTIC_INSTRUMENTS = ['acousticguitarsteel', 'acousticguitarnylon'] as const;
const ELECTRIC_INSTRUMENTS = [
  'electricguitarclean',
  'electricguitarjazz',
  'electricguitarmuted',
  'overdrivenguitar',
  'distortionguitar',
  'guitarharmonics',
] as const;

export const ALPHATEX_INSTRUMENTS = {
  acoustic: ACOUSTIC_INSTRUMENTS,
  electric: ELECTRIC_INSTRUMENTS,
  both: [...ACOUSTIC_INSTRUMENTS, ...ELECTRIC_INSTRUMENTS],
} as const;


/** Techniques that are genuinely hard on a steel-string acoustic. */
export const ACOUSTIC_HARD_TECHNIQUES: readonly Technique[] = [
  'bend',
  'pinch-harmonic',
  'tremolo-bar',
];

export const DIFFICULTY_LABELS = [
  'first steps',
  'getting it',
  'solid',
  'stretch',
  'ambitious',
] as const;

const bpm = z
  .object({
    start: z.number().int().min(30).max(300),
    target: z.number().int().min(30).max(300),
  })
  .refine((value) => value.start <= value.target, {
    message: 'bpm.start must be less than or equal to bpm.target',
  });

export const exerciseSchema = z.object({
  title: z.string().min(1),
  /** id of a file in src/content/tracks/ */
  track: z.string().min(1),
  /** position within the track */
  order: z.number().int().positive(),
  difficulty: z.number().int().min(1).max(5),
  instrument: z.enum(INSTRUMENTS),
  tuning: z.enum(TUNING_NAMES),
  technique: z.array(z.enum(TECHNIQUES)).default([]),
  /** ids of files in src/content/concepts/ */
  concepts: z.array(z.string().min(1)).default([]),
  /** ids of other exercises */
  prereqs: z.array(z.string().min(1)).default([]),
  bpm,
  timeSignature: z.string().regex(/^\d{1,2}\/\d{1,2}$/),
  /**
   * Natural phrase length in bars. Loop lengths offered by the player are
   * multiples of this that divide the exercise evenly, so a loop never cuts a
   * chord or phrase in half. Must divide the total bar count.
   */
  phraseBars: z.number().int().positive().default(1),
  goal: z.string().min(1),
  /** Flip to true only after you have actually played through it. */
  reviewed: z.boolean().default(false),
});

export const conceptSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  /** ids of other concepts */
  prereqs: z.array(z.string().min(1)).default([]),
});

export const trackSchema = z.object({
  title: z.string().min(1),
  order: z.number().int().positive(),
  focus: z.string().min(1),
  instrument: z.enum(INSTRUMENTS),
});

export type Exercise = z.infer<typeof exerciseSchema>;
export type Concept = z.infer<typeof conceptSchema>;
export type Track = z.infer<typeof trackSchema>;
