import React, { useEffect } from "react"
import Head from "next/head"
import { BASE_PATH } from "lib/paths"

/** Replacement for server-side redirects (not available on static hosting). */
const StaticRedirect = ({ to }) => {
    const target = `${BASE_PATH}${to}`
    useEffect(() => {
        window.location.replace(target)
    }, [target])
    return (
        <>
            <Head>
                <meta httpEquiv="refresh" content={`0; url=${target}`} />
                <link rel="canonical" href={target} />
            </Head>
            <p style={{ padding: "2rem", fontFamily: "monospace" }}>
                Redirecting to <a href={target}>{target}</a>
            </p>
        </>
    )
}

export default StaticRedirect
