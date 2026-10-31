import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import ContractPageView from "components/tezos/ContractPageView"
import PageLayout from "components/PageLayout"
import { Center, Spinner } from "@chakra-ui/react"

/** Generic contract dashboard for every contract in the export: /dashboards/tezos/contracts/view?a=KT1... */
const ContractViewerPage = () => {
    const router = useRouter()
    const [address, setAddress] = useState(null)
    useEffect(() => {
        if (!router.isReady) return
        const a = router.query.a
        setAddress(typeof a === "string" && a.startsWith("KT") ? a.trim() : false)
    }, [router.isReady, router.query.a])

    if (address === null) {
        return (
            <PageLayout>
                <Center paddingTop="12rem"><Spinner /></Center>
            </PageLayout>
        )
    }
    return <ContractPageView key={address || "none"} address={address} />
}

export default ContractViewerPage
