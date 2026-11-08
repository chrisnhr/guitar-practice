import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { conceptSchema, exerciseSchema, trackSchema } from './lib/schema';

const exercises = defineCollection({
  loader: glob({ base: './src/content/exercises', pattern: '**/*.md' }),
  schema: exerciseSchema,
});

const concepts = defineCollection({
  loader: glob({ base: './src/content/concepts', pattern: '**/*.md' }),
  schema: conceptSchema,
});

const tracks = defineCollection({
  loader: glob({ base: './src/content/tracks', pattern: '**/*.yaml' }),
  schema: trackSchema,
});

export const collections = { exercises, concepts, tracks };
