# The Stack Report — static site

Next.js app exported as a fully static site (`output: "export"`). See the repository README for the
data pipeline, build and deployment instructions.

```bash
npm ci
npm run build      # next build -> out/  (+ postbuild checks, sitemap, CNAME)
npm run serve      # serve out/ on http://localhost:3000
```
