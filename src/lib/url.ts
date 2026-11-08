/**
 * Astro's `import.meta.env.BASE_URL` has no trailing slash (e.g.
 * `/guitar-practice`), so `${base}exercises/` silently becomes
 * `/guitar-practiceexercises/`. Always build URLs through this module.
 */
const rawBase = import.meta.env.BASE_URL;

export const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

/** Join a path onto the site base. */
export function href(path = ''): string {
  return `${base}${path.replace(/^\/+/, '')}`;
}
