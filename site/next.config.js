const fs = require("fs")
const path = require("path")

let meta = {}
try {
  meta = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "snapshot", "meta.json"), "utf-8"))
} catch (e) {
  console.warn("snapshot/meta.json not found - run the ETL first (npm run etl)")
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""

module.exports = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  basePath,
  images: {
    unoptimized: true,
  },
  experimental: {
    esmExternals: false,
  },
  env: {
    NEXT_PUBLIC_EXPORT_DATE: meta.export_date || "",
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}
