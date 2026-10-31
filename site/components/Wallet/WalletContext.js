import React, { createContext } from "react"
import { INITIAL } from "./states"

/**
 * Archived edition: wallet connections (Beacon + sign-in-with-Tezos) required
 * backend signature verification and are disabled. The context keeps the same
 * shape so components that read it keep rendering in their "not connected" state.
 */
export const WalletContext = createContext()

const noop = () => {}

const archivedWalletState = {
    connectionState: INITIAL,
    dAppClient: null,
    address: "-",
    displayName: "-",
    activeAccount: false,
    disconnectSuccessful: false,
    userAccessToken: false,
    signInState: "init",
    signedPayload: false,
    hasBetaAccess: false,
    decodedJwt: false,
    archived: true,
    setSignInState: noop,
    actions: {
        requestPermissions: noop,
        disconnect: noop
    },
    clearUserAccessToken: noop
}

export const WalletContextProvider = ({ children }) => {
    return (
        <WalletContext.Provider value={archivedWalletState}>
            {children}
        </WalletContext.Provider>
    )
}
