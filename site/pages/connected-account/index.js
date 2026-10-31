import Head from "next/head"
import PageLayout from "components/PageLayout"
import {
    Container
} from "@chakra-ui/layout"
import { WALLET_CONNECTION } from "constants/feature_flags"
import { Link } from "@chakra-ui/next-js"
import { Heading, Text } from "@chakra-ui/react"


const ConnectedAccountPage = () => {
    return (
        <PageLayout>
            <Head>
                <title>Connected account</title>
                <meta name="description" content="Page with information about your connected account." />
            </Head>
            <Container
                maxW="container.xl"
                paddingTop="9rem"
                >
                {WALLET_CONNECTION ? null : (
                    <>
                        <Heading fontWeight="thin" marginBottom="1rem">Connected account</Heading>
                        <Text maxW="40rem" marginBottom="1rem">
                            Wallet connections and account features are not available in the archived static edition of The Stack Report.
                            Read more about the former <Link href="/interpretation-layer">Interpretation Layer</Link>.
                        </Text>
                        <Link href="/">
                            Go to home
                        </Link>
                    </>
                )}
                
                
            </Container>
        </PageLayout>
    )
}

export default ConnectedAccountPage