/**
 * Helpers shared by the Astro pages and the validator.
 */

const ALPHATEX_BLOCK = /```alphatex[^\n]*\n([\s\S]*?)```/i;

/** Pull the first fenced ```alphatex block out of a Markdown body. */
export function extractAlphaTex(body: string | undefined | null): string | null {
  if (!body) return null;
  const match = body.match(ALPHATEX_BLOCK);
  return match ? match[1].trim() : null;
}

/**
 * Remove metadata lines (`\tempo`, `\ts`, `\tuning`, ...) so lint passes that
 * look for `fret.string` tokens are not confused by numbers in metadata.
 */
export function stripMetadataLines(tex: string): string {
  return tex
    .split('\n')
    .filter((line) => !/^\s*\\/.test(line))
    .join('\n');
}

export interface FretNote {
  fret: number;
  string: number;
}

/**
 * Extract every `fret.string` token from tab source. Durations are written
 * separately (`.4`, `:8`), so a plain scan does not pick them up.
 */
export function extractFretNotes(tex: string): FretNote[] {
  const notes: FretNote[] = [];
  const pattern = /(\d{1,2})\.(\d)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tex)) !== null) {
    notes.push({ fret: Number(match[1]), string: Number(match[2]) });
  }
  return notes;
}
