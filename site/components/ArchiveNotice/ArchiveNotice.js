import React from "react"
import { Box, Container, Text } from "@chakra-ui/react"
import dayjs from "dayjs"
import { EXPORT_DATE } from "constants/feature_flags"

export const exportDateLabel = EXPORT_DATE ? dayjs(EXPORT_DATE).format("MMMM D, YYYY") : "the archive date"

/** Site-wide notice explaining the archived, static nature of the site. */
const ArchiveNotice = ({ compact = false }) => {
    if (compact) {
        return (
            <Text fontSize="0.7rem" color="gray.500">
                Archived edition. Data frozen as of {exportDateLabel}.
            </Text>
        )
    }
    return (
        <Box borderTop="1px solid rgb(200,200,200)" marginTop="4rem" background="gray.50">
            <Container maxW="container.xl" paddingTop="1rem" paddingBottom="1rem">
                <Text fontSize="0.75rem" fontWeight="bold" textTransform="uppercase">
                    Archived static edition
                </Text>
                <Text fontSize="0.75rem" color="gray.600" maxW="60rem">
                    The Stack Report is preserved as a static website. Data on this site is frozen as of {exportDateLabel}.
                    Interactive features that relied on a server (search, wallet sign-in, adding chart notes) are no longer available.
                </Text>
            </Container>
        </Box>
    )
}

export default ArchiveNotice
