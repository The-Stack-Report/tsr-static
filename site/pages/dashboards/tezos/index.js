import React from "react"
import Head from "next/head"
import { Container } from "@chakra-ui/layout"
import {
    Heading,
    Text,
    Divider
} from "@chakra-ui/react"
import PageLayout from 'components/PageLayout'
import ContractsCardsTable from "components/ContractsCardsTable"
import _ from "lodash"
import prepareContractDailyStats from "utils/data/contracts/prepareContractDailyStats"
import DashboardsCategoriesNavigation from "components/DashboardsCategoriesNavigation"
import SearchContainer from "components/SearchContainer"


const sortOptions = [
    {
        key: "sort_positions.by_calls_past_14_days",
        label: "Calls in past 2 weeks"
    },
    {
        key: "sort_positions.by_total_calls",
        label: "Calls total"
    },
]

function searchTezosContractsApi() {
    // Search required the database API; disabled in the archived edition.
    return Promise.resolve([])
}

const TezosIndexPage = ({ top_contracts = [], initial_search_term = "" }) => {
    return (
        <PageLayout>
            <Head>
                <title>The Stack Report - Contracts</title>
                <meta name="description" content="Tezos contracts dashboards by The Stack Report" />
            </Head>
            <Container maxW="container.xl" paddingTop="8rem">
                <DashboardsCategoriesNavigation
                    categories={["contracts", "entrypoints", "chain"]}
                    urlPrefix={"/dashboards/tezos"}
                    />
                <Heading>
                    Tezos{" "}
                    <Text as="span" fontWeight="light">
                    Smart Contracts
                    </Text>
                </Heading>
                <Text paddingTop="1rem" fontSize="0.8rem">
                    Search through tezos contracts and view dashboards with graphs showing contract usage history.
                </Text>
                <Divider />
                <SearchContainer
                    searchBoxLabel="Search contracts:"
                    searchBoxPlaceholder="Search by contract alias or address"
                    initialSearchTerm={initial_search_term}
                    searchData={searchTezosContractsApi}
                    searchConstruct="tezos-contracts"
                    sortOptions={sortOptions}
                    fallbackResults={top_contracts}
                    renderResults={(results, searchParams) => {
                        var searchTerm = _.get(searchParams, "searchTerm", "")
                        if (_.isArray(results) && results.length > 0) {
                            return (
                                <ContractsCardsTable
                                    contracts={results}
                                    highlightTerm={searchTerm}
                                    />
                                )
                        } else if(searchTerm == initial_search_term && _.isArray(top_contracts) && top_contracts.length > 0) {
                            return (
                                <ContractsCardsTable
                                    contracts={top_contracts}
                                    highlightTerm={searchTerm}
                                    />
                            )
                        }
                        return (
                            <p>
                                No contract dashboards found for term: {searchTerm}
                            </p>
                        )
                    }}
                    />
                
                
            </Container>
        </PageLayout>
    )
}

export async function getStaticProps() {
    const { getTopContracts } = await import("lib/staticData")
    var top_contracts = getTopContracts().map(contract => ({
        ...contract,
        _preparedDailyStats: prepareContractDailyStats(_.get(contract, "past_14_days", false))
    }))
    top_contracts = JSON.parse(JSON.stringify(top_contracts))
    return {
        props: {
            top_contracts: top_contracts,
            initial_search_term: ""
        }
    }
}

export default TezosIndexPage