import Head from "next/head"
import {
    Container,
    SimpleGrid,
    Box,
    Text,
    Heading
} from "@chakra-ui/react"
import PageLayout from 'components/PageLayout'
import FeaturedArticleBanner from "components/FeaturedArticleBanner"
import ArticleList from "components/ArticleList"
import _ from "lodash"
import { Link } from "@chakra-ui/next-js"
import MarkdownWrapper from "components/MarkdownWrapper"
import TopContractsLandingPageWidget from "components/TopContractsLandingPageWidget"
import {filterPreviewMode} from "utils/articleFilters"
import QuickLinksWidget from "components/QuickLinksWidget"
import TezosEntrypointsPreview from "components/tezos/TezosEntrypointsPreview"
import PatternDivider from "components/PatternDivider"

const LandingPage = ({ landing, latestArticles, latestWeeklies, topContractsStats }) => {
    const featured = _.get(landing, "attributes.featured.data", false)
    const aboutText = _.get(landing, "attributes.about_tsr", "")
    const googleArticlesCarouselJson = {
        "@context":"https://schema.org",
        "@type":"ItemList",
        "itemListElement": latestArticles.map((article, article_i) => {
            return {
                "@type": "ListItem",
                "position": article_i,
                "url": `https://thestackreport.xyz/articles/${article.attributes.slug}`
            }
        })
    }
    const featuredId = _.get(featured, "id", false)
    var latestArticlesWithoutFeatured = latestArticles.filter(article => article.id !== featuredId).slice(0, 5)
    return (
        <PageLayout>
            <Head>
                <title>The Stack Report</title>
                <meta name="description" content="Data driven reporting and visualisations from within the Tezos ecosystem." />
                <script type="application/ld+json"
                    dangerouslySetInnerHTML={{__html: JSON.stringify(googleArticlesCarouselJson)}}
                    />
            </Head>
            <FeaturedArticleBanner
                article={featured}
                />
            <Container maxW="container.xl" marginTop="4rem" userSelect={"none"}>
                <QuickLinksWidget
                    latestWeeklies={latestWeeklies}
                    />
            </Container>
            <Container maxW="container.xl" marginTop="4rem">
            <SimpleGrid columns={[1, 1, 2]} spacing={8}>
                <Box>
                    <Text
                        fontWeight="bold"
                        textTransform="uppercase"
                        fontSize="0.7rem"
                        >
                        Recent articles
                    </Text>
                    <ArticleList
                        articles={latestArticlesWithoutFeatured}
                        />
                    <Text>
                        {">> "}
                        <Link href="/categories">
                            More articles
                        </Link>
                    </Text>
                </Box>
                <Box>
                    <Text
                        fontWeight="bold"
                        textTransform="uppercase"
                        fontSize="0.7rem"
                        >
                        Top tezos contract dashboards <Text as="span" fontWeight="light">by nr of</Text> contract calls 
                        <Text as="span" fontWeight="light">
                            {" "}past 2 weeks.
                        </Text>
                    </Text>
                    <TopContractsLandingPageWidget
                        contracts={topContractsStats}
                        />
                    <Box paddingTop="2rem" paddingBottom="2rem">
                        <Link href="/dashboards/tezos">
                            Search through all Tezos contract dashboards
                        </Link>
                    </Box>
                </Box>
            </SimpleGrid>
            <PatternDivider />
            <Box
                maxW="container.md"
                paddingBottom="1rem"
                >
            <Text
                fontWeight="bold"
                >
                Tezos Entrypoints dashboards
            </Text>
            <Text>
                Statistics for tezos transactions grouped by entrypoint name of targeted smart contracts.
            </Text>
            </Box>
            <TezosEntrypointsPreview
                cardWidth={{
                    base: "calc(50% - 1rem)",
                    md: "calc(33% - 1rem)",
                    lg: "calc(25% - 1rem)",
                    xl: "calc(20% - 1rem)"
                }}
                />
            <Link
                href="/dashboards/tezos/entrypoints"
                >
                View all entrypoints
            </Link>
            </Container>
            <Box
                borderTop="1px solid rgb(200,200,200)"
                marginTop="4rem"
                >
                <Container maxW="container.xl">
                <Box
                    borderLeft="1px solid rgb(200,200,200)"
                    borderRight="1px solid rgb(200,200,200)"
                    marginLeft="-1px"
                    marginRight="-1px"
                    padding="0.5rem"
                    paddingTop="2rem"
                    paddingBottom="2rem"
                    paddingRight="1rem"
                    >
                    <Box maxW="60rem">
                    <Heading
                        fontWeight="thin"
                        marginBottom="1rem"
                        >
                        About The Stack Report
                    </Heading>
                    <MarkdownWrapper
                        markdownText={aboutText}
                        />
                    <br />
                    <Link href="/about" >
                        Read more
                    </Link>
                    <br />
                    </Box>
                </Box>
                </Container>
            </Box>
        </PageLayout>
    )
}

export async function getStaticProps() {
    const { getLanding, getArticles, hasCategory, getTopContracts } = await import("lib/staticData")
    const articles = getArticles()
    const isWeekly = (a) => (a.attributes.categories?.data || []).some(c => (c.attributes.Category || "").toLowerCase().includes("weekly"))
    const latestWeeklies = articles.filter(a => hasCategory(a, "Weekly")).slice(0, 5)
    const latestArticles = articles.filter(a => (a.attributes.categories?.data || []).length > 0 && !isWeekly(a))
    return {
        props: {
            landing: getLanding(),
            latestArticles: latestArticles.filter(filterPreviewMode),
            latestWeeklies: latestWeeklies.filter(filterPreviewMode),
            topContractsStats: getTopContracts().slice(0, 5)
        }
    }
}

export default LandingPage