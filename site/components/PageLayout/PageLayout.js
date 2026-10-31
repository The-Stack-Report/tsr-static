import React from "react"
import MainMenu from "components/MainMenu"
import Footer from "components/Footer"
import ArchiveNotice from "components/ArchiveNotice"
import styles from "./PageLayout.module.scss"


const PageLayout = ({ children }) => {
    return (
        <div className={styles["page-layout"]}>
            <MainMenu />
            <main>{children}</main>
            <ArchiveNotice />
            <Footer />
        </div>
    )
}

export default PageLayout