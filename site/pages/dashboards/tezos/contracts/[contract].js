import React from "react"
import ContractPageView from "components/tezos/ContractPageView"

/**
 * Pre-rendered dashboard for the most active contracts.
 * All other contracts are served by /dashboards/tezos/contracts/view?a=KT1...
 * (404.html forwards old /dashboards/tezos/contracts/KT1... links there).
 */
const ContractPage = ({ contract_meta }) => {
    return <ContractPageView contract_meta={contract_meta} />
}

export async function getStaticPaths() {
    const { getPrerenderedContracts } = await import("lib/staticData")
    return {
        paths: getPrerenderedContracts().map(address => ({ params: { contract: address } })),
        fallback: false
    }
}

export async function getStaticProps({ params }) {
    const { getContractMeta } = await import("lib/staticData")
    return { props: { contract_meta: getContractMeta(params.contract) } }
}

export default ContractPage
