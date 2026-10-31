import _ from "lodash"
import * as d3 from "d3"
import { contractShardUrl, datasetMetaUrl, dataUrl, dataBlockFileUrl } from "lib/paths"

const shardCache = {}

async function fetchGzipJson(url) {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`)
    // GitHub Pages serves .gz files as-is; decompress in the browser.
    if (typeof DecompressionStream !== "undefined") {
        const stream = resp.body.pipeThrough(new DecompressionStream("gzip"))
        const text = await new Response(stream).text()
        return JSON.parse(text)
    }
    throw new Error("This browser does not support DecompressionStream")
}

/** Load the static metadata record of a contract (from contracts_metadata export). */
export async function loadContractMeta(address) {
    const url = contractShardUrl(address)
    if (!shardCache[url]) {
        shardCache[url] = fetchGzipJson(url).catch((err) => {
            delete shardCache[url]
            throw err
        })
    }
    const shard = await shardCache[url]
    return _.get(shard, address, null)
}

/** Static dataset metadata (replacement of /api/dataset) */
export async function loadDatasetMeta(identifier) {
    const resp = await fetch(datasetMetaUrl(identifier))
    if (!resp.ok) throw new Error(`Dataset not found: ${identifier}`)
    const bucket = await resp.json()
    if (!_.has(bucket, identifier)) throw new Error(`Dataset not found: ${identifier}`)
    return bucket[identifier]
}

/**
 * Browser replacement of the old server-side getUrl(): fetch a JSON or CSV file,
 * run a prep function and round-trip through JSON like Next.js props did.
 */
export async function fetchAndPrep(url, prepFunc = (d) => d) {
    const resp = await fetch(url)
    if (!resp.ok) return false
    const text = await resp.text()
    let data = false
    if (url.endsWith(".json")) data = JSON.parse(text)
    else if (url.endsWith(".csv")) data = d3.csvParse(text)
    const prepped = prepFunc(data)
    return prepped === undefined ? prepped : JSON.parse(JSON.stringify(prepped))
}

/** React hook with the same return shape as react-fetch-hook: { isLoading, data } */
export function useContractMeta(address) {
    const React = require("react")
    const [state, setState] = React.useState({ isLoading: true, data: undefined })
    React.useEffect(() => {
        let cancelled = false
        loadContractMeta(address)
            .then(meta => { if (!cancelled) setState({ isLoading: false, data: meta || {} }) })
            .catch(() => { if (!cancelled) setState({ isLoading: false, data: {} }) })
        return () => { cancelled = true }
    }, [address])
    return state
}

var blockIndexPromise = null
/** vid_key -> slug index of all data blocks */
export function loadDataBlockIndex() {
    if (!blockIndexPromise) {
        blockIndexPromise = fetch(dataUrl("data_blocks/_index.json")).then(r => r.ok ? r.json() : {}).catch(() => ({}))
    }
    return blockIndexPromise
}

/** Load a data block record by its vid_key (replacement of /api/data_block) */
export async function loadDataBlock(vidKey) {
    const index = await loadDataBlockIndex()
    const slug = index[vidKey]
    if (!slug) throw new Error(`No data block with key ${vidKey}`)
    const resp = await fetch(dataBlockFileUrl(slug))
    if (!resp.ok) throw new Error(`No data block with key ${vidKey}`)
    return resp.json()
}
