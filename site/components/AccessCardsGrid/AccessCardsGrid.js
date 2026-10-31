import React, { useEffect, useState } from "react"
import {
    Box,
    Text,
    Image,
    Divider
} from "@chakra-ui/react"
import _ from "lodash"
import { assetUrl } from "lib/hosts"
import { dataUrl } from "lib/paths"
import { exportDateLabel } from "components/ArchiveNotice"

const COLLECTION = "KT1LaCf37XyoR4eNCzMnw6Ccp5bfPFQrKYxe"

/**
 * Archived edition: shows the Access Card collection from a static snapshot
 * (the live marketplace listing used a now defunct Teztok API).
 */
const AccessCardsGrid = ({
    leftPadding = 0
}) => {
    const [cards, setCards] = useState(false)

    useEffect(() => {
        if (cards === false) {
            fetch(dataUrl("external/access_cards.json"))
                .then(res => res.ok ? res.json() : { tokens: [] })
                .then(res => setCards(_.sortBy(_.get(res, "tokens", []), "token_id")))
                .catch(() => setCards([]))
        }
    }, [cards])

    const list = _.isArray(cards) ? cards : []

    return (
        <Box>
            <Box paddingLeft={`${leftPadding}px`} paddingBottom="1rem">
                <Text fontWeight="bold">
                    {list.length} access cards in the collection.
                </Text>
                <Text fontSize="0.8rem" color="gray.500">
                    Collection snapshot as of the archive date. Live availability and prices can be found on{" "}
                    <a href={`https://objkt.com/collection/${COLLECTION}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>objkt.com</a>.
                </Text>
            </Box>
            <Box overflowX="auto">
                <Box
                    display="flex"
                    marginLeft={`${leftPadding}px`}
                    marginRight={`${leftPadding}px`}
                    width={`${list.length * 180}px`}
                    paddingBottom="2rem"
                    >
                    {list.map((card, card_i) => {
                        var paddedTokenNr = _.toNumber(card.token_id).toString().padStart(4, '0')
                        var cdnPreview = assetUrl(`access_cards_2023/thumbnail_1k_card_${paddedTokenNr}.png`, "spacesCdn")
                        return (
                            <a
                                key={card_i}
                                href={`https://objkt.com/asset/${COLLECTION}/${card.token_id}`}
                                target="_blank"
                                rel="noreferrer"
                                >
                                <Box width="160px" marginRight="20px" role="group">
                                    <Box
                                        width="160px"
                                        border="1px solid grey"
                                        borderRadius="0.25rem"
                                        padding="0.25rem"
                                        _hover={{ background: "gray.100" }}
                                        fontSize="0.8rem"
                                        >
                                        <Image
                                            borderRadius="0.25rem"
                                            src={cdnPreview}
                                            maxWidth="100%"
                                            width="100%"
                                            alt="Beta access token"
                                            />
                                        <Text _groupHover={{ textDecoration: "underline" }}>
                                            {card.name}
                                        </Text>
                                        <Divider />
                                        <Text fontSize="0.7rem" color="gray.500">
                                            Token #{card.token_id}
                                        </Text>
                                    </Box>
                                    <Text
                                        fontSize="0.8rem"
                                        color="gray.500"
                                        width="160px"
                                        marginRight="20px"
                                        _groupHover={{ textDecoration: "underline" }}
                                        >
                                        To: objkt.com
                                    </Text>
                                </Box>
                            </a>
                        )
                    })}
                </Box>
            </Box>
        </Box>
    )
}

export default AccessCardsGrid
