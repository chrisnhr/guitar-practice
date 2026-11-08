import { readdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import * as alphaTab from '@coderline/alphatab';
import matter from 'gray-matter';
import { parse as parseYaml } from 'yaml';
import {
  ACOUSTIC_HARD_TECHNIQUES,
  ALPHATEX_INSTRUMENTS,
  TUNINGS,
  conceptSchema,
  exerciseSchema,
  trackSchema,
  type TuningName,
} from '../src/lib/schema';
import { extractAlphaTex, extractFretNotes, stripMetadataLines } from '../src/lib/alphatex';

const root = resolve(import.meta.dirname, '..');
const contentDir = resolve(root, 'src/content');

interface Issue {
  file: string;
  message: string;
}

const errors: Issue[] = [];
const warnings: Issue[] = [];

const fail = (file: string, message: string) => errors.push({ file, message });
const warn = (file: string, message: string) => warnings.push({ file, message });

function formatZod(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
  return error.issues
    .map((issue) => `${issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''}${issue.message}`)
    .join('; ');
}

function files(folder: string, extension: string): string[] {
  return readdirSync(resolve(contentDir, folder))
    .filter((file) => file.endsWith(extension))
    .sort();
}

/* -------------------------------------------------------------------------- */
/* Tracks                                                                      */
/* -------------------------------------------------------------------------- */

const trackFiles = files('tracks', '.yaml');
const trackIds = new Set(trackFiles.map((file) => basename(file, '.yaml')));

for (const file of trackFiles) {
  const source = readFileSync(resolve(contentDir, 'tracks', file), 'utf8');
  let raw: unknown;
  try {
    raw = parseYaml(source);
  } catch (error) {
    fail(`tracks/${file}`, `invalid YAML: ${(error as Error).message}`);
    continue;
  }

  const parsed = trackSchema.safeParse(raw);
  if (!parsed.success) fail(`tracks/${file}`, formatZod(parsed.error));
}

/* -------------------------------------------------------------------------- */
/* Concepts                                                                    */
/* -------------------------------------------------------------------------- */

const conceptFiles = files('concepts', '.md');
const conceptIds = new Set(conceptFiles.map((file) => basename(file, '.md')));
const conceptPrereqs = new Map<string, string[]>();

for (const file of conceptFiles) {
  const id = basename(file, '.md');
  const { data } = matter(readFileSync(resolve(contentDir, 'concepts', file), 'utf8'));
  const parsed = conceptSchema.safeParse(data);

  if (!parsed.success) {
    fail(`concepts/${file}`, formatZod(parsed.error));
    continue;
  }

  conceptPrereqs.set(id, parsed.data.prereqs);

  for (const prerequisite of parsed.data.prereqs) {
    if (!conceptIds.has(prerequisite)) {
      fail(`concepts/${file}`, `unknown concept prereq "${prerequisite}"`);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Exercises                                                                   */
/* -------------------------------------------------------------------------- */

const exerciseFiles = files('exercises', '.md');
const exerciseIds = new Set(exerciseFiles.map((file) => basename(file, '.md')));
const exercisePrereqs = new Map<string, string[]>();
const seenTitles = new Map<string, string>();

let parsedExerciseCount = 0;

function collectDiagnostics(importer: any, file: string): void {
  const severity = (alphaTab as any).importer?.alphaTex?.AlphaTexDiagnosticsSeverity as
    | Record<string, number>
    | undefined;

  const diagnostics = [
    ...(importer.lexerDiagnostics ?? []),
    ...(importer.parserDiagnostics ?? []),
    ...(importer.semanticDiagnostics ?? []),
  ];

  for (const diagnostic of diagnostics) {
    const name =
      (severity &&
        Object.entries(severity).find(([, value]) => value === diagnostic.severity)?.[0]) ??
      String(diagnostic.severity);
    const message = `alphaTex ${name.toLowerCase()}: ${diagnostic.message}`;

    if (name.toLowerCase().includes('error')) fail(file, message);
    else warn(file, message);
  }
}

for (const file of exerciseFiles) {
  const relative = `exercises/${file}`;
  const id = basename(file, '.md');
  const { data, content } = matter(readFileSync(resolve(contentDir, 'exercises', file), 'utf8'));

  const parsed = exerciseSchema.safeParse(data);
  if (!parsed.success) {
    fail(relative, formatZod(parsed.error));
    continue;
  }

  const exercise = parsed.data;
  parsedExerciseCount += 1;

  /* References ------------------------------------------------------------- */
  if (!trackIds.has(exercise.track)) {
    fail(relative, `unknown track "${exercise.track}"`);
  }

  for (const concept of exercise.concepts) {
    if (!conceptIds.has(concept)) fail(relative, `unknown concept "${concept}"`);
  }

  exercisePrereqs.set(id, exercise.prereqs);
  for (const prerequisite of exercise.prereqs) {
    if (!exerciseIds.has(prerequisite)) {
      fail(relative, `unknown exercise prereq "${prerequisite}"`);
    }
  }

  /* Duplicate titles ------------------------------------------------------- */
  const normalizedTitle = exercise.title.trim().toLowerCase();
  const duplicate = seenTitles.get(normalizedTitle);
  if (duplicate) {
    warn(relative, `title duplicates ${duplicate}: "${exercise.title}"`);
  } else {
    seenTitles.set(normalizedTitle, relative);
  }

  /* alphaTex --------------------------------------------------------------- */
  const tex = extractAlphaTex(content);
  if (!tex) {
    fail(relative, 'missing fenced ```alphatex block');
    continue;
  }

  let masterBarCount: number | null = null;

  try {
    const importer = new alphaTab.importer.AlphaTexImporter();
    importer.initFromString(tex, new alphaTab.Settings());
    const score = importer.readScore();
    masterBarCount = score.masterBars.length;
    collectDiagnostics(importer, relative);
  } catch (error) {
    fail(relative, `alphaTex failed to parse: ${(error as Error).message}`);
  }

  if (masterBarCount !== null) {
    if (exercise.phraseBars > masterBarCount) {
      fail(
        relative,
        `phraseBars ${exercise.phraseBars} is longer than the ${masterBarCount}-bar exercise`,
      );
    } else if (masterBarCount % exercise.phraseBars !== 0) {
      fail(
        relative,
        `phraseBars ${exercise.phraseBars} does not divide the ${masterBarCount}-bar exercise evenly`,
      );
    }
  }

  /* Metadata must agree with the frontmatter ------------------------------- */
  const tempo = tex.match(/\\tempo\s+(\d+(?:\.\d+)?)/i);
  if (!tempo) {
    fail(relative, 'missing \\tempo in the tab');
  } else if (Number(tempo[1]) !== exercise.bpm.target) {
    fail(relative, `\\tempo ${tempo[1]} does not match bpm.target ${exercise.bpm.target}`);
  }

  const timeSignature = tex.match(/\\ts\s*\(\s*(\d+)\s+(\d+)\s*\)/i);
  if (!timeSignature) {
    fail(relative, 'missing \\ts (...) in the tab');
  } else {
    const actual = `${timeSignature[1]}/${timeSignature[2]}`;
    if (actual !== exercise.timeSignature) {
      fail(relative, `\\ts ${actual} does not match timeSignature ${exercise.timeSignature}`);
    }
  }

  /* Instrument must match the frontmatter -------------------------------- */
  const trackMeta = tex.match(/\\track\b[^{]*\{([^}]*)\}/i);
  const instrumentMatch = trackMeta?.[1].match(/\binstrument\s+([a-z][\w-]*)/i);

  if (!trackMeta) {
    fail(relative, 'missing \\track "..." { ... } metadata in the tab');
  } else if (!instrumentMatch) {
    fail(
      relative,
      'missing instrument <name> in the \\track metadata; without it the part plays as a piano',
    );
  } else {
    const actual = instrumentMatch[1].toLowerCase();
    const allowed = ALPHATEX_INSTRUMENTS[exercise.instrument] as readonly string[];

    if (!allowed.includes(actual)) {
      fail(
        relative,
        `instrument "${actual}" does not match frontmatter instrument "${exercise.instrument}" (use ${allowed.join(' or ')})`,
      );
    }
  }

  const tuningMatch = tex.match(/\\tuning\s*\(([^)]*)\)/i);
  const expectedTuning = TUNINGS[exercise.tuning as TuningName];

  if (!tuningMatch) {
    fail(relative, 'missing \\tuning (...) in the tab');
  } else {
    const actualTuning = tuningMatch[1].trim().split(/\s+/);
    const matches =
      actualTuning.length === expectedTuning.length &&
      actualTuning.every(
        (note, index) => note.toLowerCase() === expectedTuning[index].toLowerCase(),
      );

    if (!matches) {
      fail(
        relative,
        `\\tuning (${actualTuning.join(' ')}) does not match "${exercise.tuning}" (${expectedTuning.join(' ')})`,
      );
    }
  }

  /* Musical lint ----------------------------------------------------------- */
  const notes = extractFretNotes(stripMetadataLines(tex));
  const stringCount = expectedTuning.length;

  if (notes.length === 0) {
    warn(relative, 'no fret.string notes found in the tab');
  }

  for (const note of notes) {
    if (note.string < 1 || note.string > stringCount) {
      fail(
        relative,
        `note ${note.fret}.${note.string} uses string ${note.string}, but "${exercise.tuning}" has ${stringCount} strings`,
      );
    }
    if (note.fret > 24) {
      fail(relative, `note ${note.fret}.${note.string} is above the 24th fret`);
    }
  }

  const maxFret = notes.reduce((highest, note) => Math.max(highest, note.fret), 0);

  if (exercise.instrument === 'acoustic') {
    if (maxFret > 15) {
      warn(relative, `reaches fret ${maxFret} on an acoustic; consider "both" or a lower position`);
    }

    for (const technique of exercise.technique) {
      if (ACOUSTIC_HARD_TECHNIQUES.includes(technique)) {
        warn(relative, `"${technique}" is hard on a steel-string acoustic`);
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Cycles                                                                      */
/* -------------------------------------------------------------------------- */

function findCycle(graph: Map<string, string[]>): string[] | null {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(node: string): string[] | null {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      return [...stack.slice(start), node];
    }
    if (visited.has(node)) return null;

    visiting.add(node);
    stack.push(node);

    for (const next of graph.get(node) ?? []) {
      const cycle = visit(next);
      if (cycle) return cycle;
    }

    stack.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of graph.keys()) {
    const cycle = visit(node);
    if (cycle) return cycle;
  }

  return null;
}

const exerciseCycle = findCycle(exercisePrereqs);
if (exerciseCycle) fail('exercises', `prerequisite cycle: ${exerciseCycle.join(' -> ')}`);

const conceptCycle = findCycle(conceptPrereqs);
if (conceptCycle) fail('concepts', `prerequisite cycle: ${conceptCycle.join(' -> ')}`);

/* -------------------------------------------------------------------------- */
/* Source guard                                                                */
/* -------------------------------------------------------------------------- */

// Astro's BASE_URL has no trailing slash. Reading it directly is how the
// `/guitar-practiceexercises/` links happened; route everything through url.ts.
const sourceFiles = readdirSync(resolve(root, 'src'), { recursive: true })
  .map(String)
  .filter((file) => /\.(astro|ts)$/.test(file));

for (const file of sourceFiles) {
  if (file.endsWith('lib/url.ts')) continue;

  const text = readFileSync(resolve(root, 'src', file), 'utf8');
  if (text.includes('import.meta.env.BASE_URL')) {
    fail(
      `src/${file}`,
      'use src/lib/url.ts instead of import.meta.env.BASE_URL (BASE_URL has no trailing slash)',
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Report                                                                      */
/* -------------------------------------------------------------------------- */

for (const warning of warnings) console.warn(`warning  ${warning.file}: ${warning.message}`);
for (const error of errors) console.error(`error    ${error.file}: ${error.message}`);

console.log('');
console.log(
  `Validated ${parsedExerciseCount} exercise(s), ${conceptIds.size} concept(s), ${trackIds.size} track(s).`,
);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);

if (errors.length > 0) process.exitCode = 1;
