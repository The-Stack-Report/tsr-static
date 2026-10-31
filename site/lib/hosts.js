/**
 * Single place for every external host the static site depends on.
 *
 * Stage 1: chart data, videos and images are still served from DigitalOcean Spaces.
 * Stage 2: point these to self-hosted copies and nothing else needs to change.
 *
 * NOTE: Spaces only allows browser data fetches (CORS) from https://thestackreport.xyz
 * and http://localhost:3000. Serve the site from one of those origins.
 */
export const HOSTS = {
    spaces: "https://the-stack-report.ams3.digitaloceanspaces.com",
    spacesCdn: "https://the-stack-report.ams3.cdn.digitaloceanspaces.com",
}

const KNOWN_PREFIXES = [
    ["https://the-stack-report.ams3.cdn.digitaloceanspaces.com/", "spacesCdn"],
    ["https://the-stack-report.ams3.digitaloceanspaces.com/", "spaces"],
]

/**
 * Resolve a Spaces asset. Accepts a bucket-relative path ("datasets/...") or a
 * legacy absolute Spaces URL, and returns the URL on the configured host.
 */
export function assetUrl(urlOrPath, host = "spaces") {
    if (typeof urlOrPath !== "string" || urlOrPath.length === 0) return urlOrPath
    for (const [prefix, hostKey] of KNOWN_PREFIXES) {
        if (urlOrPath.startsWith(prefix)) {
            return `${HOSTS[hostKey]}/${urlOrPath.slice(prefix.length)}`
        }
    }
    if (/^https?:\/\//.test(urlOrPath)) return urlOrPath
    return `${HOSTS[host]}/${urlOrPath.replace(/^\//, "")}`
}

/** Rewrite every Spaces URL inside a block of text (article markdown / html). */
export function rewriteAssetUrls(text) {
    if (typeof text !== "string") return text
    let out = text
    for (const [prefix, hostKey] of KNOWN_PREFIXES) {
        out = out.split(prefix).join(`${HOSTS[hostKey]}/`)
    }
    return out
}

export const contractDailyStatsUrl = (address) =>
    assetUrl(`datasets/tezos/contracts_daily_stats/${address}-daily-stats.json`)

export const contractXtzStatsUrl = (address) =>
    assetUrl(`datasets/tezos/contracts_daily_stats/${address}-entrypoints-daily-xtz-stats.csv`)
