import React, { useState, useEffect, useMemo } from "react"
import useFetch from "react-fetch-hook"
import { contractDailyStatsUrl, contractXtzStatsUrl } from "lib/hosts"
import { loadContractMeta, useContractMeta } from "lib/clientData"
import Chart from "components/Charts/Chart"
import { Link } from "@chakra-ui/next-js"
import {
    Text
} from "@chakra-ui/react"
import prepareDf from "utils/data/prepareDf"
import * as d3 from "d3"
import _ from "lodash"

function xtzStatsPrepFunc(rawText) {
    var rawDf = d3.csvParse(rawText)
    var nrCols = _.keys(_.first(rawDf)).filter(c => c !== "date")
    var preppedData = prepareDf(
        rawDf,
        ["date"],
        nrCols
    )
    return preppedData
}


function xtzUrl(address) {
    var url = contractXtzStatsUrl(address)
    return url
}

var ContractXtzChart = ({
    address,
    view,
    chartProps
}) => {
    const { isLoading, data, error } = useFetch(xtzUrl(address), {
        formatter: (resp) => {
            return resp.text()
        }
    })

    const [metaData, setMetaData] = useState(false)
    const [loadingMeta, setLoadingMeta] = useState(false)

    var preparedData = useMemo(() => {
        if(_.isString(data)) {
            return xtzStatsPrepFunc(data)
        } else {
            return false
        }
    }, [data])

    useEffect(() => {
        if(metaData === false && loadingMeta === false) {
            setLoadingMeta(true)
            loadContractMeta(address)
                .then(metaDataResp => {
                    setMetaData(metaDataResp || {})
                })
                .catch(() => setMetaData({}))
        }
        
    }, [metaData, loadingMeta, address])


    if(isLoading === true || !_.isObject(metaData)) {
        return (
            <div style={{height: 200}}>
                Loading {address}
            </div>
        )
    }

    var contract = metaData
    

    
    return (
        <div>
            {preparedData ? (
                <ChartRenderer
                    address={address}
                    contract={contract}
                    data={preparedData}
                    view={view}
                    chartProps={chartProps}
                    />
            ) : (
                <p>Loading</p>
            )}
            
        </div>
    )
}

const ChartRenderer = ({
    address,
    data,
    contract,
    view,
    chartProps
}) => {
    var defaultCols = _.keys(_.first(data)).filter(c => c.endsWith("sum"))
    var color = "black"

    var _props = {

    }

    var cols = defaultCols
    if(_.has(chartProps, "initialColumnToggles")) {
        cols = chartProps.initialColumnToggles
    }

    cols = _.sortBy(cols.map(c => {
        return {
            c: c,
            total: _.sum(data.map(p => _.get(p, c, 0)))
        }
    }), "total").map(c => c.c).reverse()

    _props = {
        ..._props,
        ...chartProps
    }
    return (
        <>
        <Chart
            data={data}
            columns={cols}
            color={color}
            height={300}
            timelineBrush={true}
            badgesLegend={true}
            yAxisTickLabel="xtz"
            {..._props}
            />
        <Text
            fontSize="0.7rem"
            textAlign="right"
            marginBottom="1rem"
            color="gray.500"
            >
            Dashboard:{" "}
            <Link prefetch={false} href={`/dashboards/tezos/contracts/${address}#xtz-statistics`}>
                {_.get(contract, "tzkt_account_data.alias", address)}
            </Link>
        </Text>
        </>
    )
}

export default ContractXtzChart