import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
    render() {
        return (
            <Html lang="en">
                <Head>
                <meta httpEquiv="X-UA-Compatible" content="ie=edge" />

                <link rel="icon" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/blocks-favicon.png`} />
                <script type="application/ld+json"
                    dangerouslySetInnerHTML={{__html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "url": "https://thestackreport.xyz",
                        "logo": "https://thestackreport.xyz/blocks-favicon.png"
                    })}}
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument