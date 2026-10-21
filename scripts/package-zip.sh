#!/usr/bin/env bash
# Package the IT Asset Hub project into download/it-asset-hub-source.zip
# Repeatable: run this any time the source changes and the zip needs a refresh.
#
# Zip-only deviations from the live sandbox project (kept intentional):
#   - package.json: drop `tee` from dev script (Windows-safe),
#     remove unused z-ai-web-dev-sdk, add postinstall `prisma generate`
#   - next-env.d.ts: drop the .next/dev/types/routes.d.ts import so the
#     editor is clean BEFORE the first `npm run dev` (Next regenerates it)
#   - examples/, figma_shots/, skills/, tests/ excluded (sandbox artifacts)
set -euo pipefail

ROOT=/home/z/my-project
STAGE_PARENT="$ROOT/.zscripts/stage"
APP=it-asset-hub
STAGE="$STAGE_PARENT/$APP"
OUT="$ROOT/download/it-asset-hub-source.zip"

rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"

# -- copy source tree --------------------------------------------------------
cp -r "$ROOT/src" "$ROOT/prisma" "$ROOT/scripts" "$ROOT/public" "$ROOT/db" "$STAGE/"
cp "$ROOT/package.json" "$ROOT/bun.lock" "$ROOT/tsconfig.json" \
   "$ROOT/next.config.ts" "$ROOT/tailwind.config.ts" "$ROOT/postcss.config.mjs" \
   "$ROOT/eslint.config.mjs" "$ROOT/components.json" "$ROOT/next-env.d.ts" "$STAGE/"
cp "$ROOT/.zscripts/package-readme.md" "$STAGE/README.md"
printf 'DATABASE_URL="file:../db/custom.db"\n' > "$STAGE/.env.example"
cp "$STAGE/.env.example" "$STAGE/.env"
rm -f "$STAGE/db/custom.db-journal"

# -- zip-only patch 1: package.json ------------------------------------------
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
p.scripts.dev = "next dev -p 3000";
p.scripts.postinstall = "prisma generate";
delete p.dependencies["z-ai-web-dev-sdk"];
fs.writeFileSync(process.argv[1], JSON.stringify(p, null, 2) + "\n");
' "$STAGE/package.json"

# -- zip-only patch 2: next-env.d.ts (clean before first dev run) ------------
sed -i '\#\.next/dev/types/routes\.d\.ts#d' "$STAGE/next-env.d.ts"

# -- zip it ------------------------------------------------------------------
mkdir -p "$ROOT/download"
(cd "$STAGE_PARENT" && zip -rq "$OUT" "$APP")
unzip -t "$OUT" > /dev/null && echo "zip OK"
du -h "$OUT" | cut -f1 | xargs -I{} echo "size: {}"
unzip -l "$OUT" | tail -1
