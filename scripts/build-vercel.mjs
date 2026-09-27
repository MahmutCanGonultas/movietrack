/**
 * Builds the whole app into .vercel/output (Vercel Build Output API v3):
 *
 *   static/              the Vite build of apps/web
 *   functions/api.func/  apps/api bundled into one ESM file by esbuild
 *   config.json          /api/* → the function, everything else → the SPA,
 *                        plus the two daily cron jobs
 *
 * One project, one domain: the browser calls /api on the same origin, so the
 * auth cookie stays first-party and no rewrite to another host is needed.
 *
 * Deploy with: pnpm deploy:vercel   (runs this, then `vercel deploy --prebuilt --prod`)
 */
import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = `${root}.vercel/output`;
const fn = `${out}/functions/api.func`;

rmSync(out, { recursive: true, force: true });
mkdirSync(fn, { recursive: true });

console.log("› building apps/web");
execSync("pnpm --filter @movie-tracker/web build", { cwd: root, stdio: "inherit" });
cpSync(`${root}apps/web/dist`, `${out}/static`, { recursive: true });

console.log("› bundling apps/api");
await build({
  entryPoints: [`${root}apps/api/src/vercel.ts`],
  outfile: `${fn}/index.mjs`,
  tsconfig: `${root}apps/api/tsconfig.json`,
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  legalComments: "none",
  logLevel: "warning",
  /* CommonJS dependencies inside an ES module still expect these. */
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      "const require = __createRequire(import.meta.url);",
      "const __filename = __fileURLToPath(import.meta.url);",
      "const __dirname = __pathDirname(__filename);",
    ].join("\n"),
  },
});

writeFileSync(
  `${fn}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs22.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
      maxDuration: 60,
      /* Next to the Neon database (eu-central-1); iad1 added a transatlantic
         round trip to every query. */
      regions: ["fra1"],
    },
    null,
    2,
  ),
);

writeFileSync(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "^/api(?:/.*)?$", dest: "/api" },
        { handle: "filesystem" },
        { src: "^/(.*)$", dest: "/index.html" },
      ],
      /* UTC: 03:00 and 05:00 in Istanbul, as the old node-cron schedule was. */
      crons: [
        { path: "/api/cron/daily", schedule: "0 0 * * *" },
        { path: "/api/cron/embeddings", schedule: "0 2 * * *" },
      ],
    },
    null,
    2,
  ),
);

console.log("✓ .vercel/output ready");
