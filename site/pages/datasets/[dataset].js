import React from "react"
import DatasetDetail from "components/DatasetDetail"

/** Pre-rendered detail pages for the general (non-entrypoint) datasets.
 *  All 28k datasets are reachable through /datasets/view?id=<identifier>. */
const DatasetPage = (props) => <DatasetDetail {...props} />

export async function getStaticPaths() {
    const { getGeneralDatasets } = await import("lib/staticData")
    return {
        paths: getGeneralDatasets().map(d => ({ params: { dataset: d.identifier } })),
        fallback: false
    }
}

export async function getStaticProps({ params }) {
    const { getDatasetMeta } = await import("lib/staticData")
    const dataset = getDatasetMeta(params.dataset)
    if (!dataset) return { props: { errorMessage: "Incorrect dataset identifier.", error: true } }
    return { props: { dataset, error: false } }
}

export default DatasetPage
