/** Mirrors etl/build_snapshot.py -> safe_name() */
export function safeName(s) {
    return String(s).replace(/[^A-Za-z0-9_.\-]/g, (c) => "~" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"))
}

/** Mirrors etl/build_snapshot.py -> bucket_name(): case-insensitive file name.
 *  Such files contain a dict keyed by the original (case-sensitive) key. */
export const bucketName = (s) => safeName(String(s).toLowerCase())

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

/** URL of a static data file published under /public/data */
export const dataUrl = (path) => `${BASE_PATH}/data/${path}`

export const datasetMetaUrl = (identifier) => dataUrl(`datasets/by-id/${bucketName(identifier)}.json`)
export const dataBlockFileUrl = (slug) => dataUrl(`data_blocks/${slug}.json`)
export const dataBlockHref = (block) => `/data_blocks/${block.slug || safeName(block.vid_key)}/`
export const chartDefinitionUrl = (slug) => dataUrl(`charts/${bucketName(slug)}.json`)
export const chartNotesUrl = (chartId) => dataUrl(`notes/${bucketName(chartId)}.json`)
export const contractShardUrl = (address) => dataUrl(`contracts/meta/${bucketName(String(address).slice(3, 5))}.json.gz`)

/** Dashboard URL for any contract: pre-rendered page or the generic viewer. */
export const contractPageHref = (address) => `/dashboards/tezos/contracts/${address}`
export const contractViewerHref = (address) => `/dashboards/tezos/contracts/view?a=${address}`

// Entrypoint names that only differ in letter case from a more active entrypoint are not
// pre-rendered (case-insensitive file systems); they are served by the viewer page.
import viewerOnlyEntrypoints from "lib/generated/entrypointsViewerOnly.json"
const VIEWER_ONLY_ENTRYPOINTS = new Set(viewerOnlyEntrypoints)

export const entrypointHref = (name) => VIEWER_ONLY_ENTRYPOINTS.has(name)
    ? `/dashboards/tezos/entrypoints/view?e=${encodeURIComponent(name)}`
    : `/dashboards/tezos/entrypoints/${name}`
