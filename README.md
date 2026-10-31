# The Stack Report: archived static edition

A fully static rebuild of [thestackreport.xyz](https://thestackreport.xyz), hosted on GitHub Pages.
It has no database, CMS, API routes, wallet login or analytics. The original Next.js UI is kept;
features that needed a server are shown in a frozen, non-interactive state.

This is **Stage 1** of `../STATIC_REBUILD_PLAN.md`. Chart data files, videos and images are still
loaded from DigitalOcean Spaces. All database content is converted to static JSON in this repository.

```
tsr-static/
  etl/build_snapshot.py   database exports -> static JSON (run locally, needs the raw exports)
  snapshot/               build-time data, read by getStaticProps (generated, committed)
  site/                   Next.js app, static export -> site/out/
    public/data/          data fetched by the browser at runtime (generated, committed)
    lib/hosts.js          the ONLY place where external hosts (Spaces) are configured
    lib/paths.js          URLs of static data files + route helpers
    lib/staticData.js     build-time data access (getStaticProps/getStaticPaths)
    lib/clientData.js     browser-side loaders (gzip shards, dataset metadata, data blocks)
  .github/workflows/deploy.yml   build + deploy to GitHub Pages
```

## Where the data comes from

| Content | Source export | Static location |
|---|---|---|
| Articles, categories, authors, landing page, chart definitions | CMS (`stack-report-cms/*.jsonl`) | `snapshot/cms/*.json` (Strapi response shape), `public/data/charts/` |
| 184,092 contract metadata records | Mongo `contracts_metadata` | `public/data/contracts/meta/*.json.gz` (830 gzipped shards, ~41 MB) |
| Top contracts (landing page, dashboards) | Mongo `contracts_metadata.sort_positions` | `snapshot/contracts/top_14d.json` |
| 28,034 dataset metadata records | Mongo `datasets` | `public/data/datasets/by-id/*.json`, `snapshot/datasets/*.json` |
| 437 data blocks (videos) | Mongo `data_blocks` | `snapshot/data_blocks/all.json`, `public/data/data_blocks/` |
| 33 public chart notes (curated + community) | Mongo `chart_notes` | `public/data/notes/` |
| Access card collection | TzKT API snapshot (Teztok API is defunct) | `public/data/external/access_cards.json` |
| Entrypoints statistics index | Spaces (downloaded once by the ETL) | `snapshot/entrypoints/rich-statistics-index.csv` |
| Chart data, per-contract daily stats, videos, images | DigitalOcean Spaces | **still remote**, resolved through `lib/hosts.js` |

Deliberately **not** published: CMS admin/user/permission tables and API tokens, private and deleted
chart notes, `frontend_interaction_log` (contains session IDs), and pipeline state collections
(`system_state`, `contracts_daily_stats_sync_state`, `data-workers`, `rabbit-mq-task-response-queues`).

Data files whose keys differ only in letter case (Tezos addresses and entrypoint names are case
sensitive) are grouped into lowercase "bucket" files that hold a dict keyed by the original key.
This keeps the build working on case-insensitive file systems such as macOS and Windows.

## Routes

| Route | Rendering |
|---|---|
| `/`, `/about`, `/articles/*`, `/categories/*`, `/charts/*` | pre-rendered |
| `/dashboards/tezos`, `/dashboards/tezos/contracts` | pre-rendered top 25 (frozen as of the export date), search disabled |
| `/dashboards/tezos/contracts/<KT1…>` | pre-rendered for 3,076 contracts with ≥ 1,000 calls |
| `/dashboards/tezos/contracts/view?a=<KT1…>` | any of the 184,092 contracts (metadata from shards, stats from Spaces) |
| `/dashboards/tezos/entrypoints/<name>` | pre-rendered for 3,487 entrypoints |
| `/dashboards/tezos/entrypoints/view?e=<name>` | any entrypoint (used for 21 names that only differ in case) |
| `/datasets`, `/datasets/<id>` | catalog + 5 general datasets pre-rendered |
| `/datasets/view?id=<identifier>` | any of the 28,034 datasets |
| `/data_blocks`, `/data_blocks/<slug>`, `/data_blocks/iframe?block=<key>` | all 437 blocks |
| `404.html` | forwards old dynamic URLs (contracts, entrypoints, datasets, URL-encoded data block keys) to the static equivalents |

## Archive mode

Configured in `site/constants/feature_flags.js`:

- `ARCHIVE_MODE`: wallet connection, interaction logging, note editing and search are disabled.
- `FREEZE_CHART_INTERACTIONS`: chart hover tooltips and the timeline brush are disabled.
  Set it to `false` to restore them; they work client-side without a server.

## Rebuilding the data snapshot

Only needed when the exports change. The raw exports are never committed.

```bash
TSR_SOURCE=/path/to/source python3 -I etl/build_snapshot.py            # everything (~1 min)
TSR_SOURCE=/path/to/source python3 -I etl/build_snapshot.py cms notes  # only some parts
```

Parts: `cms`, `datasets`, `entrypoints`, `data_blocks`, `notes`, `contracts`, `external`.
`TSR_PRERENDER_MIN_CALLS` (default 1000) sets which contracts get a pre-rendered page.

## Build and preview

```bash
cd site
npm ci
npm run build      # static export to site/out (~3 min, ~7,100 pages, ~460 MB)
npm run serve      # GitHub-Pages-like preview on http://localhost:3000
```

`npm run build` also runs `scripts/postbuild.mjs`. This script:
- writes `.nojekyll`, `CNAME`, `sitemap.xml` and `robots.txt`
- fails the build if any file is ≥ 95 MB or the site exceeds 950 MB
- fails the build if code still references the retired `/api/*` routes or API hosts

**Previewing locally:** Spaces only allows browser data fetches (CORS) from `https://thestackreport.xyz`
and `http://localhost:3000`. Preview on exactly `http://localhost:3000`, or chart data will not load.

## Deployment (GitHub Pages)

1. Push this directory as a repository and set **Settings → Pages → Source: GitHub Actions**.
2. Set the custom domain `thestackreport.xyz` and enforce HTTPS.
3. DNS:
   - apex `A`/`AAAA` records → GitHub Pages IPs
   - `www` `CNAME` → `<org>.github.io`

   GitHub then redirects `www` to the apex, which is the origin allowed by the Spaces CORS rules.
4. Every push to `main` builds and deploys. The workflow warns if Spaces stops sending the CORS header.

Serving from any other origin (a `*.github.io` preview, `www`, a staging domain) requires adding that
origin to the CORS rules of the `the-stack-report` Space in the DigitalOcean console.

## Stage 2: dropping DigitalOcean Spaces

All Spaces URLs are resolved through `assetUrl()` in `site/lib/hosts.js`. This covers article
markdown (`rewriteAssetUrls`), dataset URLs, contract stats, videos and images. After mirroring the
bucket, point `HOSTS.spaces` / `HOSTS.spacesCdn` to the new location(s). No component changes are needed.
