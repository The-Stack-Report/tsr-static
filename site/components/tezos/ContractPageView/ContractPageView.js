import React, { useEffect, useState } from "react"
import Head from "next/head"
import {
    Container
} from "@chakra-ui/layout"
import {
    Heading,
    Text,
    Spinner,
    Center,
    Badge,
    Box
} from "@chakra-ui/react"
import PageLayout from "components/PageLayout"
import TezosContractDashboard from "components/tezos/TezosContractDashboard"
import { Link } from "@chakra-ui/next-js"
import _ from "lodash"
import prepareContractDailyStats from "utils/data/contracts/prepareContractDailyStats"
import { fetchAndPrep, loadContractMeta } from "lib/clientData"
import { contractDailyStatsUrl, contractXtzStatsUrl } from "lib/hosts"
import prepareDf from "utils/data/prepareDf"
import InPageNavigator from "components/InPageNavigator"


var sections = [
    {
        title: "Contract usage",
        id: "contract-usage"
    },
    {
        title: "Transaction flow",
        id: "contract-transaction-flow"
    },
    {
        title: "Baker fees",
        id: "baker-fees"
    },
    {
        title: "Block share",
        id: "block-share"
    },
    
    {
        title: "XTZ statistics",
        id: "contract-xtz-statistics"
    }
]

var sectionsAsDict = {}

sections.forEach(section => {
    sectionsAsDict[section.id] = section
})

function xtzStatsPrepFunc(rawDf) {
    var nrCols = _.keys(_.first(rawDf)).filter(c => c !== "date")
    var preppedData = prepareDf(
        rawDf,
        ["date"],
        nrCols
    )
    preppedData.forEach(p => {
        p['date'] = p['date'].toJSON()
    })

    return preppedData
}


const ContractPageView = ({
    address: addressProp = false,
    contract_meta: initialMeta = false
}) => {
    const [contract_meta, setContractMeta] = useState(initialMeta)
    const [metaState, setMetaState] = useState(initialMeta ? "loaded" : "loading")
    const [dailyStats, setDailyStats] = useState(false)
    const [dailyStatsState, setDailyStatsState] = useState("loading")
    const [xtzEntrypointsStats, setXtzEntrypointsStats] = useState(false)

    const requestedAddress = addressProp || _.get(initialMeta, "address", false)

    // Contract metadata from the static export (only needed when not pre-rendered)
    useEffect(() => {
        if (!requestedAddress || initialMeta) return
        let cancelled = false
        setMetaState("loading")
        loadContractMeta(requestedAddress).then(meta => {
            if (cancelled) return
            setContractMeta(meta || false)
            setMetaState(meta ? "loaded" : "not-found")
        }).catch(err => {
            console.log("error loading contract metadata", err)
            if (!cancelled) setMetaState("error")
        })
        return () => { cancelled = true }
    }, [requestedAddress, initialMeta])

    // Daily statistics files (served from the data host)
    useEffect(() => {
        if (!requestedAddress || metaState !== "loaded") return
        let cancelled = false
        setDailyStatsState("loading")
        fetchAndPrep(contractDailyStatsUrl(requestedAddress), prepareContractDailyStats).then(stats => {
            if (cancelled) return
            setDailyStats(stats || false)
            setDailyStatsState(stats ? "loaded" : "unavailable")
        }).catch(err => {
            console.log("error loading contract daily stats", err)
            if (!cancelled) setDailyStatsState("unavailable")
        })
        fetchAndPrep(contractXtzStatsUrl(requestedAddress), xtzStatsPrepFunc).then(stats => {
            if (!cancelled) setXtzEntrypointsStats(stats || false)
        }).catch(() => {})
        return () => { cancelled = true }
    }, [requestedAddress, metaState])

    var error = !requestedAddress || metaState === "not-found" || metaState === "error"
    var errorMessage = !requestedAddress
        ? "Missing contract address."
        : (metaState === "error" ? "Could not load contract data." : `No dashboard found for contract ${requestedAddress}.`)
    var address = _.get(contract_meta, "address", requestedAddress || 'no-address')
    var alias = _.get(contract_meta, "tzkt_account_data.alias", address)

    return (
        <PageLayout>
            <Head>
                <title>{`Dashboard - ${alias}`}</title>
                <meta name="description" content="Dashboard page." />
            </Head>
            <InPageNavigator
                sections={sections}
                contentOffset={"8rem"}
                >
            <Container maxW="container.xl" paddingTop="7rem" id="page-top">
                {error ? (
                    <React.Fragment>
                        <Text>{errorMessage}</Text>
                        <Box height="0.5rem" />
                        <Link
                            href="/dashboards/tezos" 
                            >
                            <Text 
                                fontSize="0.7rem"
                                paddingTop="0.5rem"
                                textDecoration="underline"
                                >
                                Back to contract dashboards overview.
                            </Text>
                        </Link>
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <Box
                            position="absolute"
                            paddingTop={{
                                base: "0.5rem",
                                md: "1rem"
                            }}
                            >
                        <Link href="/dashboards/tezos" fontSize="0.7rem">
                            To Tezos dashboards overview
                        </Link>
                        </Box>
                        
                        <Heading
                            marginTop={{
                                base: "2.5rem",
                                md: "4rem"
                            }}
                            fontWeight="thin"
                            >
                            {alias}
                        </Heading>
                        <Badge
                            color="gray.500"
                            variant="outline"
                            size="small"
                            fontSize="0.7rem"
                            >
                            Tezos contract
                        </Badge>
                            {(contract_meta && dailyStats) ? (
                                <TezosContractDashboard
                                    contract={contract_meta}
                                    dailyStats={dailyStats}
                                    xtzEntrypointsStats={xtzEntrypointsStats}
                                    sectionsAsDict={sectionsAsDict}
                                    />
                            ) : (contract_meta && dailyStatsState === "unavailable") ? (
                                <Box paddingTop="4rem" paddingBottom="4rem" maxW="40rem">
                                    <Text>
                                        No daily usage statistics are available for this contract.
                                    </Text>
                                    <Text fontSize="0.8rem" color="gray.500" paddingTop="0.5rem">
                                        {`Total contract calls: ${_.get(contract_meta, "total_contract_calls", 0)}`}
                                    </Text>
                                </Box>
                            ) : (
                                <Center
                                    paddingTop="8rem"
                                    >
                                <Spinner />
                                </Center>
                            )}
                    </React.Fragment>
                )}
            </Container>
            </InPageNavigator>
        </PageLayout>
    )
}


export default ContractPageView
