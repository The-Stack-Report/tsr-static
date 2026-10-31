import React, { useEffect, useState } from "react"
import Head from "next/head"
import PageLayout from 'components/PageLayout'
import {
    Heading,
    Text,
    Box,
    Container
} from "@chakra-ui/react"
import _ from "lodash"
import { assetUrl } from "lib/hosts"
import { Center, Spinner } from "@chakra-ui/react"
import * as d3 from "d3"
import Dataset from "models/Dataset"
import prepareDf from "utils/data/prepareDf"
import InPageNavigator from "components/InPageNavigator"
import { Link } from "@chakra-ui/next-js"
import TezosEntrypointDashboard from "components/tezos/TezosEntrypointDashboard"


var sections = [
    {
        title: "Entrypoint network",
        id: "entrypoint-network"
    },
    {
        title: "Entrypoint usage",
        id: "entrypoint-usage"
    },
    {
        title: "Accounts involved",
        id: "accounts-involved"
    }
    
]

var sectionsAsDict = {}

sections.forEach(section => {
    sectionsAsDict[section.id] = section
})

const TezosEntrypointAnalysisView = ({
    entrypoint,
    timeseries,
    timeseriesDatasetJson,

    topAccountsCalling,
    topAccountsCallingDatasetJson,

    topContractsTargeted,
    topContractsTargetedDatasetJson,

    entrypointSummary,
    entrypointSummaryDatasetJson

}) => {
    

    var t_series = []
    var tSeriesDataset = {}

    var topAccountsCallingDf = []
    var topAccountsCallingDataset = {}

    var topContractsTargetedDf = []
    var topContractsTargetedDataset = {}

    var entrypointSummaryDataset = {}
    
    
    try {
        t_series = prepareDf(timeseries, ["date"],
            [
                "transactions",
                "senders",
                "targets"
            ]
        )

        tSeriesDataset = new Dataset(timeseriesDatasetJson)

        var transactions_sum = 0
        t_series.forEach((row) => {
            transactions_sum += row.transactions
            row["transactions_sum"] = transactions_sum
            row[`${entrypoint} calls`] = row.transactions
            row[`Contracts targeted`] = row.targets
            row[`Accounts sending`] = row.senders
            row[`${entrypoint} calls sum`] = row.transactions_sum
        })

        topAccountsCallingDf = prepareDf(topAccountsCalling, ["Last Transaction"],
            [
                "Transactions",
                "Unique Targets"
            ]
        )

        topAccountsCallingDf.forEach(row => {
            row["name"] = row["tzkt_alias"]
            if(!row["name"]) {
                row["name"] = row["address"]
            }
        })

        topAccountsCallingDataset = new Dataset(topAccountsCallingDatasetJson)

        topContractsTargetedDf = prepareDf(topContractsTargeted, ["Last Transaction"],
            [
                "Transactions",
                "Unique Targets"
            ]
        )
        topContractsTargetedDf.forEach(row => {
            row["name"] = row["tzkt_alias"]
            if(!row["name"]) {
                row["name"] = row["address"]
            }
        })

        topContractsTargetedDataset = new Dataset(topContractsTargetedDatasetJson)

        entrypointSummaryDataset = new Dataset(entrypointSummaryDatasetJson)


    } catch (e) {
        console.log(e)
    }
    
    var dataLoaded = t_series.length > 0 && _.keys(tSeriesDataset).length > 0

    var renderedSections = sections

    if (!dataLoaded) {
        renderedSections = []
    }

    return (
        <PageLayout>
            <Head>
                <title>{`${entrypoint} entrypoint analysis`}</title>
                <meta name="description" content={`Tezos blockchain analysis of transactions targetting entrypoint ${entrypoint}.`} />
            </Head>
            <InPageNavigator
                sections={renderedSections}
                contentOffset={"6.5rem"}
                >
                <Container maxW="container.xl" id="page-top">
                    <Box
                        position="absolute"
                        top="4rem"
                        paddingTop={{
                            base: "6rem",
                            md: "6rem"
                        }}
                        zIndex={100}
                        >
                        <Link href="/dashboards/tezos/entrypoints" fontSize="0.7rem">
                            To Tezos entrypoints overview
                        </Link>
                    </Box>
                    
                    <Heading
                        marginTop={{
                            base: "9rem",
                            md: "9rem"
                        }}
                        top="3rem"
                        position="absolute"
                        zIndex={100}
                        pointerEvents={"none"}
                        >
                        {entrypoint}<br />
                        <Text as="span" fontWeight="light" opacity={0.5}>
                        entrypoint analysis
                        </Text>
                    </Heading>
                </Container>
                {dataLoaded ? (
                    <TezosEntrypointDashboard
                        entrypoint={entrypoint}
                        calls_timeseries={t_series}
                        tSeriesDataset={tSeriesDataset}
                        topAccountsCallingDf={topAccountsCallingDf}
                        topAccountsCallingDataset={topAccountsCallingDataset}
                        topContractsTargetedDf={topContractsTargetedDf}
                        topContractsTargetedDataset={topContractsTargetedDataset}
                        entrypointSummary={entrypointSummary}
                        entrypointSummaryDataset={entrypointSummaryDataset}
                        sections={sectionsAsDict}
                        />
                ) : (
                    <Container maxW="container.xl">
                        <Text marginTop="25rem" marginBottom="15rem" textAlign="center">
                            Data unavailable for entrypoint {entrypoint}.
                        </Text>
                    </Container>
                )}
                
            </InPageNavigator>
        </PageLayout>
    )
}

async function loadDatasetFile(datasetJson) {
    var url = _.get(datasetJson, "url", false)
    if (!_.isString(url)) return false
    try {
        const resp = await fetch(assetUrl(url))
        if (!resp.ok) return false
        const text = await resp.text()
        const fileType = _.toLower(url.split(".").pop())
        if (fileType === "csv") return d3.csvParse(text)
        if (fileType === "json") return JSON.parse(text)
    } catch (err) {
        console.log("error loading dataset file", url, err)
    }
    return false
}

/**
 * Static shell: dataset metadata is embedded at build time, the data files
 * are loaded in the browser from the data host.
 */
const TezosEntrypointAnalysisPage = ({
    entrypoint,
    timeseriesDatasetJson,
    topAccountsCallingDatasetJson,
    topContractsTargetedDatasetJson,
    entrypointSummaryDatasetJson
}) => {
    const [files, setFiles] = useState(false)

    useEffect(() => {
        let cancelled = false
        setFiles(false)
        Promise.all([
            loadDatasetFile(timeseriesDatasetJson),
            loadDatasetFile(topAccountsCallingDatasetJson),
            loadDatasetFile(topContractsTargetedDatasetJson),
            loadDatasetFile(entrypointSummaryDatasetJson)
        ]).then(([timeseries, topAccountsCalling, topContractsTargeted, entrypointSummary]) => {
            if (cancelled) return
            setFiles({ timeseries, topAccountsCalling, topContractsTargeted, entrypointSummary })
        })
        return () => { cancelled = true }
    }, [entrypoint, timeseriesDatasetJson, topAccountsCallingDatasetJson, topContractsTargetedDatasetJson, entrypointSummaryDatasetJson])

    if (files === false) {
        return (
            <PageLayout>
                <Head>
                    <title>{`${entrypoint} entrypoint analysis`}</title>
                    <meta name="description" content={`Tezos blockchain analysis of transactions targetting entrypoint ${entrypoint}.`} />
                </Head>
                <Container maxW="container.xl" paddingTop="9rem">
                    <Heading>
                        {entrypoint}<br />
                        <Text as="span" fontWeight="light" opacity={0.5}>
                        entrypoint analysis
                        </Text>
                    </Heading>
                    <Center paddingTop="8rem" paddingBottom="16rem"><Spinner /></Center>
                </Container>
            </PageLayout>
        )
    }

    return (
        <TezosEntrypointAnalysisView
            entrypoint={entrypoint}
            timeseries={files.timeseries}
            timeseriesDatasetJson={timeseriesDatasetJson}
            topAccountsCalling={files.topAccountsCalling}
            topAccountsCallingDatasetJson={topAccountsCallingDatasetJson}
            topContractsTargeted={files.topContractsTargeted}
            topContractsTargetedDatasetJson={topContractsTargetedDatasetJson}
            entrypointSummary={files.entrypointSummary}
            entrypointSummaryDatasetJson={entrypointSummaryDatasetJson}
            />
    )
}

export default TezosEntrypointAnalysisPage
