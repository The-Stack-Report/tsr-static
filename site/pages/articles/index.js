import Head from "next/head"
import { Container } from "@chakra-ui/layout"
import {
    Heading,
    GridItem,
    SimpleGrid,
    Box,
    Text
} from "@chakra-ui/react"
import ArticleList from "components/ArticleList"
import _ from "lodash"
import CategoriesTags from "components/CategoriesTags"
import PageLayout from 'components/PageLayout'
import { Link } from "@chakra-ui/next-js"



const ArticlesPage = ({ articles, categories }) => {
    return (
        <PageLayout>
            <Head>
                <title>The Stack Report - News</title>
                <meta name="description" content="Recent articles on The Stack Report" />
            </Head>
            <Container maxW="container.xl" style={{paddingTop: 100}}>
                <SimpleGrid
                    minChildWidth="300px"
                    columns={[4]}
                    gap={{
                        base: "1rem",
                        md: "4rem"
                    }}
                    >
                    <GridItem
                        colSpan={2}
                        >
                        <Heading
                            as="h1"
                            fontWeight="thin"
                            marginTop={{
                                base: "2rem",
                                md: "4rem"
                            }}
                            marginBottom="2rem"
                            >
                            Latest articles
                        </Heading>
                        {articles.length > 0 ? (
                            <ArticleList articles={articles} />
                        ) : (
                            <Text>
                                No current articles.
                            </Text>
                        )}
                        <Box height={{
                                base: "2rem",
                                md: "4rem"
                            }} />
                    </GridItem>
                        <GridItem>
                        <Heading
                            as="h2"
                            fontWeight="thin"
                            marginTop={{
                                base: "2rem",
                                md: "4rem"
                            }}
                            marginBottom="2rem"
                            >
                            Categories
                        </Heading>
                        {categories && (
                            <CategoriesTags categories={categories} />
                        )}
                        <Box fontSize="0.8rem" marginTop="2rem">
                        <Link href="/categories">
                            To categories overview
                        </Link>
                        </Box>
                        <Box height="4rem"/>
                    </GridItem>
                </SimpleGrid>
                
            </Container>
        </PageLayout>
    )
}

export async function getStaticProps() {
    const { getArticles, getCategoriesPlain } = await import("lib/staticData")
    return {
        props: {
            articles: getArticles(),
            categories: getCategoriesPlain()
        }
    }
}

export default ArticlesPage