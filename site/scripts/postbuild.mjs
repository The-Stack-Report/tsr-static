// Post-build checks and GitHub Pages extras for the static export in ./out
import fs from "fs"
import path from "path"

const OUT = path.join(process.cwd(), "out")
const MAX_FILE = 95 * 1024 * 1024
const MAX_TOTAL = 950 * 1024 * 1024

if (!fs.existsSync(OUT)) {
    console.error("out/ not found - run next build first")
    process.exit(1)
}

// GitHub Pages: disable Jekyll processing (keeps _next/ folder) and set the custom domain.
fs.writeFileSync(path.join(OUT, ".nojekyll"), "")
const domain = process.env.TSR_CNAME ?? "thestackreport.xyz"
if (domain) fs.writeFileSync(path.join(OUT, "CNAME"), domain + "\n")

// sitemap.xml + robots.txt (viewer shells with query parameters are excluded)
const SITE_URL = (process.env.TSR_SITE_URL || "https://thestackreport.xyz").replace(/\/$/, "")
const pages = []
const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (["_next", "data"].includes(entry.name) && dir === OUT) continue
            collect(p)
        } else if (entry.name === "index.html") {
            const rel = "/" + path.relative(OUT, dir).split(path.sep).join("/")
            const route = rel === "/" ? "/" : rel + "/"
            if (/\/(view|iframe|404|connected-account)\/$/.test(route)) continue
            if (route.startsWith("/dashboards/") && route === "/dashboards/") continue
            pages.push(route)
        }
    }
}
collect(OUT)
pages.sort()
const esc = (u) => u.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages.map(r => `  <url><loc>${esc(SITE_URL + r)}</loc></url>`).join("\n") +
    `\n</urlset>\n`)
fs.writeFileSync(path.join(OUT, "robots.txt"),
    `User-agent: *\nDisallow: /data/\nDisallow: /dashboards/tezos/contracts/view/\nDisallow: /dashboards/tezos/entrypoints/view/\nDisallow: /datasets/view/\nDisallow: /data_blocks/iframe/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
console.log(`[postbuild] sitemap.xml with ${pages.length} pages`)

let total = 0
let files = 0
const tooLarge = []
const forbidden = []
const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) { walk(p); continue }
        const size = fs.statSync(p).size
        total += size
        files += 1
        if (size > MAX_FILE) tooLarge.push(`${path.relative(OUT, p)} (${(size / 1e6).toFixed(1)} MB)`)
        if (/\.(html|js)$/.test(entry.name)) {
            const text = fs.readFileSync(p, "utf-8")
            const m = text.match(/\/api\/(account_chart_notes|chart_note|contracts?|dataset|data_blocks?|log_event|logging|verify_signature|rate_limit_test)\b/)
            if (m) forbidden.push(`${path.relative(OUT, p)}: references ${m[0]}`)
            if (/teztok\.com|ondigitalocean\.app/.test(text)) forbidden.push(`${path.relative(OUT, p)}: references a retired API host`)
        }
    }
}
walk(OUT)

console.log(`[postbuild] ${files} files, ${(total / 1e6).toFixed(1)} MB in out/`)
let failed = false
if (tooLarge.length) { console.error("[postbuild] files over 95 MB:\n  " + tooLarge.join("\n  ")); failed = true }
if (total > MAX_TOTAL) { console.error("[postbuild] site exceeds 950 MB budget"); failed = true }
if (forbidden.length) { console.error("[postbuild] server API references found:\n  " + forbidden.slice(0, 20).join("\n  ")); failed = true }
process.exit(failed ? 1 : 0)
