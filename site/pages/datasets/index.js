import { entrypointHref } from "lib/paths"
import Head from "next/head"
import { 
    Container
} from "@chakra-ui/layout"
import {
    Heading,
    Text,
    Box,
    Divider
} from "@chakra-ui/react"
import _ from "lodash"
import PageLayout from "components/PageLayout"
import DataTable from "components/DataTable"
import { assetUrl } from "lib/hosts"

const pinnedDatasetsIdentifiers = [
    "the-stack-report--tezos-daily-chain-stats",
    "the-stack-report--tezos-accounts-index",
    "the-stack-report--tezos-entrypoints-index"
]

const DatasetsCatalogPage = ({ generalDatasets = [], entrypointFamilies = [], legacyDatasets = [], totalDatasets = 0 }) => {
    var pinnedDatasets = generalDatasets.filter(dataset => pinnedDatasetsIdentifiers.includes(dataset.identifier))

    return (
        <PageLayout>
            <Head>
                <title>Datasets</title>
                <meta name="description" content="Datasets catalog used for The Stack Report graphs." />
            </Head>
            <Container maxW="container.xl" style={{paddingTop:100}}>
                <Heading
                    as="h1"
                    fontWeight="thin"
                    marginTop={{
                        base: "2rem",
                        md: "4rem"
                    }}
                    marginBottom="1rem"
                    >
                    Dataset catalog
                </Heading>
                <Text fontSize="sm" marginBottom="2rem">
                    {totalDatasets.toLocaleString("en-US")} datasets published by The Stack Report.
                </Text>
                <Heading as="h2" marginTop={{ base: "2rem", md: "3rem" }} marginBottom="2rem" fontSize="1.5rem">
                    Pinned datasets
                </Heading>
                <Text fontSize="sm" marginBottom="1rem">
                    Curated list of datasets.
                </Text>
                <DataTable
                    data={pinnedDatasets}
                    columns={[ "identifier", "date" ]}
                    colLinks={{
                        identifier: (row) => `/datasets/${row['identifier']}`
                    }}
                    />
                <Box height={{base: "2rem", md: "4rem"}} />
                <Divider />
                <Heading as="h2" marginTop={{ base: "2rem", md: "4rem" }} marginBottom="2rem" fontSize="1.5rem">
                    All general datasets
                </Heading>
                <DataTable
                    data={generalDatasets}
                    columns={[ "identifier", "title", "type", "format", "last_update" ]}
                    colLinks={{
                        identifier: (row) => `/datasets/${row['identifier']}`
                    }}
                    />
                <Box height={{base: "2rem", md: "4rem"}} />
                <Divider />
                <Heading as="h2" marginTop={{ base: "2rem", md: "4rem" }} marginBottom="1rem" fontSize="1.5rem">
                    Entrypoint datasets
                </Heading>
                <Text fontSize="sm" marginBottom="1rem" maxW="50rem">
                    For every Tezos smart contract entrypoint name, a family of datasets is available: time series,
                    summary, top 100 accounts and smart contracts, full lists and network graphs.
                    Open an entrypoint to see all its datasets.
                </Text>
                <DataTable
                    data={entrypointFamilies}
                    columns={[ "entrypoint", "datasets", "time-series" ]}
                    rowKey={"entrypoint"}
                    colLinks={{
                        "entrypoint": (row) => entrypointHref(row.entrypoint),
                        "time-series": (row) => `/datasets/view?id=${row["time-series"]}`
                    }}
                    maxRows={25}
                    />
                <Box height={{base: "2rem", md: "4rem"}} />
                <Divider />
                <Heading as="h2" marginTop={{ base: "2rem", md: "4rem" }} marginBottom="2rem" fontSize="1.5rem">
                    Old datasets
                </Heading>
                <DataTable
                    data={legacyDatasets}
                    columns={[ "key", "upload_date" ]}
                    colLinks={{
                        key: (row) => row.url
                    }}
                    rowProps={{color: "gray.500"}}
                    />
                
                <Box height={{base: "2rem", md: "4rem"}} />
            </Container>
        </PageLayout>
    )
}

export async function getStaticProps() {
    const { getGeneralDatasets, getEntrypointDatasets, snapshot, snapshotText } = await import("lib/staticData")
    const d3 = await import("d3")
    const families = getEntrypointDatasets()

    // Order entrypoints by number of transactions (rich statistics index), unknown ones last.
    var order = {}
    try {
        d3.csvParse(snapshotText("entrypoints/rich-statistics-index.csv")).forEach(row => {
            order[row.entrypoint] = _.toInteger(row.transactions)
        })
    } catch (e) {}

    var entrypointFamilies = _.sortBy(Object.keys(families), e => -(order[e] || 0)).map(entrypoint => ({
        entrypoint,
        datasets: Object.keys(families[entrypoint]).length,
        "time-series": _.get(families[entrypoint], "time-series.identifier", "")
    }))

    var legacyDatasets = snapshot("datasets/legacy.json").map(d => ({
        key: d.key || d.title || "",
        upload_date: d.upload_date || null,
        url: assetUrl(d.spaces_url || "")
    }))

    const generalDatasets = getGeneralDatasets()
    const totalDatasets = generalDatasets.length + _.sumBy(entrypointFamilies, "datasets")

    return {
        props: {
            generalDatasets,
            entrypointFamilies,
            legacyDatasets,
            totalDatasets
        }
    }
}

export default DatasetsCatalogPage
