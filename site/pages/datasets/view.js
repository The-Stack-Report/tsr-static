import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import DatasetDetail from "components/DatasetDetail"
import PageLayout from "components/PageLayout"
import { Center, Spinner } from "@chakra-ui/react"
import { loadDatasetMeta } from "lib/clientData"

/** Dataset detail for any dataset in the catalog: /datasets/view?id=<identifier> */
const DatasetViewerPage = () => {
    const router = useRouter()
    const [state, setState] = useState({ loading: true })

    useEffect(() => {
        if (!router.isReady) return
        const id = router.query.id
        if (typeof id !== "string" || id.length === 0) {
            setState({ loading: false, error: true, errorMessage: "Missing dataset identifier." })
            return
        }
        loadDatasetMeta(id)
            .then(dataset => setState({ loading: false, dataset }))
            .catch(() => setState({ loading: false, error: true, errorMessage: "Incorrect dataset identifier." }))
    }, [router.isReady, router.query.id])

    if (state.loading) {
        return (
            <PageLayout>
                <Center paddingTop="12rem"><Spinner /></Center>
            </PageLayout>
        )
    }
    return <DatasetDetail dataset={state.dataset} error={state.error} errorMessage={state.errorMessage} />
}

export default DatasetViewerPage
