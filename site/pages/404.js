import React, { useEffect, useState } from "react"
import Head from "next/head"
import { Container, Heading, Text, Spinner } from "@chakra-ui/react"
import { Link } from "@chakra-ui/next-js"
import PageLayout from "components/PageLayout"
import { BASE_PATH } from "lib/paths"
import { loadDataBlockIndex } from "lib/clientData"

/**
 * GitHub Pages serves this page for any unknown path. Old dynamic URLs
 * that have no pre-rendered page are forwarded to their static viewer.
 */
async function resolveLegacyPath(pathname, search) {
    let p = pathname
    if (BASE_PATH && p.startsWith(BASE_PATH)) p = p.slice(BASE_PATH.length)
    p = p.replace(/\/+$/, "")
    let m

    // /dashboards/tezos/contracts/KT1... -> generic contract viewer
    if ((m = p.match(/^\/dashboards\/tezos\/contracts\/(KT1[1-9A-HJ-NP-Za-km-z]{33})$/))) {
        return `/dashboards/tezos/contracts/view/?a=${m[1]}`
    }
    // /dashboards/tezos/entrypoints/<name> (names that are not pre-rendered) -> entrypoint viewer
    if ((m = p.match(/^\/dashboards\/tezos\/entrypoints\/([^/]+)$/)) && m[1] !== "view") {
        return `/dashboards/tezos/entrypoints/view/?e=${encodeURIComponent(decodeURIComponent(m[1]))}`
    }
    // /datasets/<identifier> -> dataset viewer
    if ((m = p.match(/^\/datasets\/([^/]+)$/)) && m[1] !== "view") {
        return `/datasets/view/?id=${encodeURIComponent(decodeURIComponent(m[1]))}`
    }
    // /data_blocks/<url encoded vid_key> -> /data_blocks/<safe name>/
    if ((m = p.match(/^\/data_blocks\/(.+)$/)) && !p.startsWith("/data_blocks/iframe")) {
        const key = decodeURIComponent(decodeURIComponent(m[1]))
        const index = await loadDataBlockIndex()
        if (index[key]) return `/data_blocks/${index[key]}/`
    }
    // /data_blocks/iframe?block=... without trailing slash
    if (p === "/data_blocks/iframe") return `/data_blocks/iframe/${search}`
    return null
}

const NotFoundPage = () => {
    const [state, setState] = useState("checking")

    useEffect(() => {
        resolveLegacyPath(window.location.pathname, window.location.search).then(target => {
            if (target) {
                setState("redirecting")
                window.location.replace(`${BASE_PATH}${target}`)
            } else {
                setState("not-found")
            }
        }).catch(() => setState("not-found"))
    }, [])

    return (
        <PageLayout>
            <Head>
                <title>Page not found - The Stack Report</title>
                <meta name="robots" content="noindex" />
            </Head>
            <Container maxW="container.xl" paddingTop="10rem" paddingBottom="10rem">
                {state === "not-found" ? (
                    <>
                        <Heading fontWeight="thin" marginBottom="1rem">Page not found</Heading>
                        <Text marginBottom="1rem">
                            This page does not exist in the archived edition of The Stack Report.
                        </Text>
                        <Link href="/">Go to home</Link>
                    </>
                ) : (
                    <Spinner />
                )}
            </Container>
        </PageLayout>
    )
}

export default NotFoundPage
