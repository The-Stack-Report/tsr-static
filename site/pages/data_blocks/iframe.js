import Head from 'next/head'
import React, { useEffect, useState } from 'react'
import { Text } from "@chakra-ui/react"
import _ from "lodash"
import { useRouter } from "next/router"
import SilentVideo from "components/SilentVideo"
import { assetUrl } from "lib/hosts"
import { loadDataBlock } from "lib/clientData"

/** Embeddable data block player: /data_blocks/iframe?block=<vid_key> */
const BlockIFramePage = () => {
    const router = useRouter()
    const [state, setState] = useState({ loading: true })

    useEffect(() => {
        if (!router.isReady) return
        const key = router.query.block
        if (!_.isString(key) || key.length === 0) {
            setState({ loading: false, error: true, errorMessage: "Missing block key." })
            return
        }
        loadDataBlock(key)
            .then(block => setState({ loading: false, block }))
            .catch(() => setState({ loading: false, error: true, errorMessage: "Incorrect block key." }))
    }, [router.isReady, router.query.block])

    const { block, error, errorMessage } = state
    const spaces_url = _.get(block, "spaces_url", false)
    return (
        <div>
            <Head>
                <title>Data block embed</title>
                <meta name="description" content="Data block embed view." />
            </Head>
            {error ? (
                <div>
                    <Text>{errorMessage}</Text>
                </div>
            ) : (
                <React.Fragment>
                    {spaces_url && (
                        <SilentVideo
                            src={assetUrl(spaces_url)}
                            resolution={block.video_meta}
                            />
                    )}
                </React.Fragment>
            )}
        </div>
    )
}

export default BlockIFramePage
