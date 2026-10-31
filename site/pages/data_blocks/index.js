import React, { useState, useEffect } from "react"
import Head from 'next/head'
import { Container } from '@chakra-ui/layout'
import {
    Heading,
    Input,
    Text,
    Box,
    Button
} from "@chakra-ui/react"
import _ from "lodash"
import PageLayout from 'components/PageLayout'
import BlocksGrid from "components/BlocksGrid"
import useDebounce from "utils/hooks/useDebounce"
import MarkdownWrapper from "components/MarkdownWrapper"
import { Link } from "@chakra-ui/next-js"

const replacementMessage = _.trim(`
The Data Blocks were an experiment in pre-rendered charts but is currently discontinued.
Instead, a new more scalable and more creative approach for social sharing of charts and metrics is being developed.

In the mean time, check out the [dashboards](/dashboards/tezos) for the latest data visualizations with continuously updating metrics.

`)



const DataBlocksCatalogPage = ({ blocks }) => {
    var blocksForGrid = blocks
    return (
        <PageLayout>
            <Head>
                <title>Data blocks - Catalog</title>
                <meta name="description" content="Catalog of all The Stack Report animated data visualisations." />

            </Head>
            <Container maxW="container.xl" style={{paddingTop: 100, paddingBottom: 200}}>
                <Heading
                    as="h1"
                    fontWeight="thin"
                    marginBottom="2rem"
                    marginTop={{
                        base: "2rem",
                        md: "4rem"
                    }}
                    >
                    Data blocks
                </Heading>

                <Box padding="1rem" boxShadow="md" border="1px solid rgb(220,220,220)" borderRadius="5px" marginBottom="2rem">
                    <MarkdownWrapper markdownText={replacementMessage} />
                    <Link href="/dashboards/tezos">
                        <Button
                            bg="black"
                            color="white"
                            _hover={{
                                bg: "black",
                                textDecoration: "underline"
                            }}
                            >
                            Dashboards
                        </Button>
                    </Link>
                </Box>
                <Input
                    placeholder="Search is unavailable in the archived edition"
                    type="text"
                    isDisabled
                    readOnly
                    value=""
                    marginBottom="1rem"
                    />
                <Text fontSize="0.8rem" color="gray.500" marginBottom="2rem">
                    All {blocksForGrid.length} data blocks, most recent first.
                </Text>
                <BlocksGrid blocks={blocksForGrid} />
            </Container>
        </PageLayout>
    )
}

export async function getStaticProps() {
    const { getDataBlocks } = await import("lib/staticData")
    return { props: { blocks: getDataBlocks() } }
}

export default DataBlocksCatalogPage