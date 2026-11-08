#!/usr/bin/env bash
#
# Deploy the already-built site to the gh-pages branch.
#
# This exists because GitHub Actions is unavailable while the account is
# billing-locked. It needs no CI: `npm run deploy` builds, then force-pushes
# dist/ to gh-pages. See README.md for the Pages settings.

set -euo pipefail

cd "$(dirname "$0")/.."
root="$(pwd)"

if [ ! -d dist ]; then
  echo "dist/ not found. Run 'npm run build' first." >&2
  exit 1
fi

remote="${GIT_REMOTE:-origin}"
branch="${DEPLOY_BRANCH:-gh-pages}"
message="${DEPLOY_MESSAGE:-Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)}"
remote_url="$(git remote get-url "$remote")"

# GitHub Pages runs Jekyll on branch deployments unless this file is present.
# Jekyll silently drops directories starting with an underscore, which would
# break /_astro/.
touch dist/.nojekyll

# alphaTab's Vite plugin copies its own Sonivox bank into dist/soundfont/ on
# every build. We serve GeneralUser GS from public/audio/ instead, so skip the
# unused ~2.2 MB.
rm -rf dist/soundfont

cd dist

if [ "$(pwd)" != "$root/dist" ]; then
  echo "Refusing to deploy from an unexpected directory." >&2
  exit 1
fi

rm -rf .git
git init -q -b "$branch"
git add -A
git -c user.name="${GIT_AUTHOR_NAME:-$(git config user.name)}" \
    -c user.email="${GIT_AUTHOR_EMAIL:-$(git config user.email)}" \
    commit -q -m "$message"
git remote add origin "$remote_url"
git push -f origin "$branch"

echo "Deployed dist/ to branch '$branch'."
