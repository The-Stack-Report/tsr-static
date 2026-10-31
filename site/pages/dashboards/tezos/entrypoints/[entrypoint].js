import React from "react"
import EntrypointPageView from "components/tezos/EntrypointPageView"

/**
 * Pre-rendered entrypoint dashboards. Entrypoint names that only differ in letter case
 * are served by /dashboards/tezos/entrypoints/view?e=<name> (404.html forwards them).
 */
const TezosEntrypointPage = (props) => <EntrypointPageView {...props} />

export async function getStaticPaths() {
    const { getPrerenderedEntrypoints } = await import("lib/staticData")
    return {
        paths: getPrerenderedEntrypoints().map(entrypoint => ({ params: { entrypoint } })),
        fallback: false
    }
}

export async function getStaticProps({ params }) {
    const { getDatasetMeta } = await import("lib/staticData")
    const entrypoint = params.entrypoint
    const meta = (suffix) => getDatasetMeta(`the-stack-report--tezos-entrypoint-${entrypoint}-${suffix}`) || {}
    return {
        props: {
            entrypoint,
            timeseriesDatasetJson: meta("time-series"),
            topAccountsCallingDatasetJson: meta("accounts-calling-top-100"),
            topContractsTargetedDatasetJson: meta("smart-contracts-top-100"),
            entrypointSummaryDatasetJson: meta("summary")
        }
    }
}

export default TezosEntrypointPage
