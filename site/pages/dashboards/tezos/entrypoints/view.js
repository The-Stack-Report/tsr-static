import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import EntrypointPageView from "components/tezos/EntrypointPageView"
import PageLayout from "components/PageLayout"
import { Center, Spinner } from "@chakra-ui/react"
import { loadDatasetMeta } from "lib/clientData"

const SUFFIXES = {
    timeseriesDatasetJson: "time-series",
    topAccountsCallingDatasetJson: "accounts-calling-top-100",
    topContractsTargetedDatasetJson: "smart-contracts-top-100",
    entrypointSummaryDatasetJson: "summary"
}

/** Entrypoint dashboard for any entrypoint name: /dashboards/tezos/entrypoints/view?e=<name> */
const EntrypointViewerPage = () => {
    const router = useRouter()
    const [props, setProps] = useState(false)

    useEffect(() => {
        if (!router.isReady) return
        const entrypoint = typeof router.query.e === "string" ? router.query.e : ""
        Promise.all(Object.entries(SUFFIXES).map(([key, suffix]) =>
            loadDatasetMeta(`the-stack-report--tezos-entrypoint-${entrypoint}-${suffix}`)
                .then(meta => [key, meta])
                .catch(() => [key, {}])
        )).then(entries => {
            setProps({ entrypoint, ...Object.fromEntries(entries) })
        })
    }, [router.isReady, router.query.e])

    if (!props) {
        return (
            <PageLayout>
                <Center paddingTop="12rem"><Spinner /></Center>
            </PageLayout>
        )
    }
    return <EntrypointPageView key={props.entrypoint} {...props} />
}

export default EntrypointViewerPage
