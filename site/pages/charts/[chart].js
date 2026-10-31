import React from "react"
import Head from "next/head"
import { Container } from "@chakra-ui/layout"
import {
    Heading,
    Box,
    Text,
    Divider
} from "@chakra-ui/react"
import PageLayout from "components/PageLayout"
import _ from "lodash"
import ChartLoader from "components/Charts/ChartLoader"
import prepareChartMetadata from "utils/prepareChartMetadata"
import MarkdownWrapper from "components/MarkdownWrapper"
import { Link } from "@chakra-ui/next-js"

const ChartPage = ({ chart }) => {
    const richDescription = _.get(chart, "rich_description", false)
    return (
        <PageLayout>
            <Head>
                <title>TSR - Chart: {_.get(chart, "name", "")}</title>
                <meta name="description" content={_.get(chart, "description", "")} />

            </Head>
            <Container maxW="container.xl" paddingTop="100px" paddingBottom="100px">
                        <Box
                            position="absolute"
                            paddingTop={{
                                base: "0rem",
                                md: "1rem"
                            }}
                            >
                        <Link href="/charts" fontSize="0.7rem">
                            To charts overview
                        </Link>
                        </Box>
                <Heading
                    marginTop={{
                        base: "2rem",
                        md: "4rem"
                    }}
                    marginBottom="2rem"
                    fontWeight="thin"
                    >
                    {"Chart - "}
                    <Text as="span" fontWeight="bold" textTransform="uppercase">
                        {_.get(chart, "name","")}
                    </Text>
                </Heading>
                {_.isObject(chart) && (
                    <ChartLoader
                        chart={chart}
                        timelineBrush={true}
                        showChartNotes={true}
                        />
                )}
                {_.isString(richDescription) && (
                    <>
                    <Divider />
                    <Box maxWidth="700px">
                        <Heading as="h5" fontWeight="thin" fontSize="1.6rem" paddingTop="1rem" paddingBottom="2rem">About this chart</Heading>
                    <MarkdownWrapper markdownText={richDescription} />
                    </Box>
                    </>
                )}
                
            </Container>
        </PageLayout>
    )
}

export async function getStaticPaths() {
    const { getCharts } = await import("lib/staticData")
    return {
        paths: getCharts().map(c => ({ params: { chart: c.attributes.slug } })),
        fallback: false
    }
}

export async function getStaticProps({ params }) {
    const { getChartBySlug } = await import("lib/staticData")
    const chartObj = getChartBySlug(params.chart)
    if (!chartObj) return { props: { errorMessage: "Chart not found.", error: true } }
    return { props: { chart: prepareChartMetadata(chartObj.attributes) } }
}

export default ChartPage