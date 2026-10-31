import Head from "next/head"
import { Container } from "@chakra-ui/layout"
import {
    Heading,
    Box,
    Text
} from "@chakra-ui/react"
import PageLayout from "components/PageLayout"
import _ from "lodash"
import prepareChartMetadata from "utils/prepareChartMetadata"
import ChartLoader from "components/Charts/ChartLoader"

const ChartsPage = ({ charts }) => {
    return (
        <PageLayout>
            <Head>
                <title>The Stack Report - Charts</title>
                <meta name="description" content="Charts by The Stack Report." />
            </Head>
            <Container maxW="container.xl" paddingTop="8rem">
                <Heading>
                    Charts
                </Heading>
                {charts.map((chart, chart_i) => {
                    return (
                        <Box
                            paddingBottom="2rem"
                            key={chart_i}
                            >
                        <ChartLoader
                            chart={chart}
                            timelineBrush={true}
                            />
                        </Box>
                    )
                })}
            </Container>
        </PageLayout>
    )
}

export async function getStaticProps() {
    const { getCharts } = await import("lib/staticData")
    return { props: { charts: getCharts().map(c => prepareChartMetadata(c.attributes)) } }
}

export default ChartsPage