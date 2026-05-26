## Goal
Verify fridgespy.com with Google Search Console and submit the sitemap.

## Steps

### 1. Inject verification meta tag
Add the Google site verification meta tag into the server-rendered `<head>` of `src/routes/__root.tsx` so it appears on every page.

Token:
```
<meta name="google-site-verification" content="oS_ZVuCIVDyEnihG2xi0AQmeAeMzb86j12PAzUXsbHk" />
```

### 2. Verify ownership with Google
Call the Site Verification API using the META method after the deployed site serves the tag.

### 3. Add site to Search Console
Call `webmasters/v3/sites/https%3A%2F%2Ffridgespy.com%2F` to register the property.

### 4. Submit sitemap
Call `webmasters/v3/sites/https%3A%2F%2Ffridgespy.com%2F/sitemaps/https%3A%2F%2Ffridgespy.com%2Fsitemap.xml` to submit the existing sitemap.

## Technical details
- Uses the already-linked Google Search Console connector (std_01ks17e1t0fgtbk5665qxfbvnv)
- Gateway calls use `$LOVABLE_API_KEY` and `$GOOGLE_SEARCH_CONSOLE_API_KEY`
- The site identifier is `https://fridgespy.com/` (custom domain)
- The sitemap already exists at `src/routes/sitemap[.]xml.ts`

## Outcome
Google Search Console will be fully connected, the site verified, and the sitemap submitted for indexing.