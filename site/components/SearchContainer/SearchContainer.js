import React from "react"
import {
    Text,
    SimpleGrid,
    Box,
    Input,
    InputGroup,
    InputLeftElement,
    Select
} from "@chakra-ui/react"
import { SearchIcon } from "@chakra-ui/icons"

/**
 * Archived edition of the search container.
 * Search required a database server; the UI is kept but frozen and the
 * pre-rendered default results (fallbackResults) are shown.
 */
const SearchContainer = ({
    searchBoxLabel = "Search",
    sortOptions = [],
    fallbackResults = [],
    renderResults = () => []
}) => {
    return (
        <Box>
            <SimpleGrid
                columns={{sm: 1, md: 2}}
                marginTop="1rem"
                marginBottom="1rem"
                >
                <Box paddingRight="1rem" paddingBottom="1rem">
                    <Text fontSize="0.7rem" color="gray.500">
                        {searchBoxLabel}
                    </Text>
                    <InputGroup>
                        <InputLeftElement pointerEvents="none" color="gray.300">
                            <SearchIcon color="gray.400" />
                        </InputLeftElement>
                        <Input
                            isDisabled
                            value=""
                            readOnly
                            placeholder="Search is unavailable in the archived edition"
                            />
                    </InputGroup>
                </Box>
                {sortOptions.length > 0 && (
                    <Box maxW="400px">
                        <Text fontSize="0.7rem" color="gray.500">
                            Sorted by:
                        </Text>
                        <Select isDisabled defaultValue={sortOptions[0].key}>
                            {sortOptions.map(option => (
                                <option value={option.key} key={option.key}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </Box>
                )}
            </SimpleGrid>
            <Box>
                {renderResults(fallbackResults, {
                    searchTerm: "",
                    searchTermDebounced: ""
                }, false)}
            </Box>
        </Box>
    )
}

export default SearchContainer
