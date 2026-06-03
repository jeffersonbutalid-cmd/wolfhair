# Wolf Hair Restoration — Landing Page

Doctor-led hair restoration landing page for Wolf Hair Restoration (Cincinnati, OH).
Static site: plain HTML, CSS, and JS with no build step.

## Structure

- `index.html` — homepage landing page
- `hair-transplant-cincinnati.html` — local "stay local" landing page
- `fue-artas.html` — FUE / ARTAS / FUT procedure landing page
- `cost-financing.html` — pricing and financing landing page
- `assets/wolf.css` — shared styles (design tokens drive the theme)
- `assets/wolf.js` — interactions: lead form, before/after slider, reviews carousel, FAQ, scroll reveals, gclid/UTM capture
- `assets/img/` — page imagery, favicons, and the social share image
- `favicon.ico`, `site.webmanifest` — favicon set (built from the brand mark) and PWA manifest
- `robots.txt`, `sitemap.xml`, `llms.txt` — crawl, indexing, and AI/answer-engine discovery
- `netlify.toml` — Netlify publish settings, clean URLs, security and cache headers
- `CLAUDE.md` — brand, compliance, and content conventions (read before editing copy)

## SEO / AEO / GEO

- Every page has a unique title, meta description, canonical, Open Graph + Twitter cards, and a shared 1200x630 share image.
- Structured data (JSON-LD): MedicalClinic with full NAP, geo, and service area; Physician, MedicalProcedure, Offer, FAQPage, and BreadcrumbList.
- Local SEO: consistent NAP across pages, geo meta tags, and `geo`/`areaServed` in schema.
- `robots.txt` explicitly allows major AI answer-engine crawlers; `llms.txt` summarizes the business for them.
- The placeholder domain is `lp.wolfhair.info`; update it in canonicals, OG/Twitter URLs, `sitemap.xml`, `robots.txt`, `llms.txt`, and the JSON-LD before launch if the production domain differs.

## Deploy with GitHub + Netlify

1. Push this repo to GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and pick this GitHub repo.
3. Netlify auto-detects `netlify.toml`. There is no build command and the publish directory is the repo root, so just deploy.

Every push to the connected branch triggers an automatic redeploy.

## Tracking & conversions

- Google Tag Manager (`GTM-52LFNR9P`) is installed on every page (head script + `<body>` noscript).
- On a successful submission the visitor is redirected to `/thank-you`. That page pushes a `lead_form_success` dataLayer event and is the recommended conversion trigger in GTM. It is `noindex` and excluded from the sitemap.
- The styled homepage form redirects via `wolf.js` (`window.WOLF_THANKYOU_URL`, default `/thank-you`).
- The GoHighLevel iframe forms also attempt a parent redirect on submit, but for guaranteed behavior set the redirect URL to `https://lp.wolfhair.info/thank-you` in the GHL form builder (On Submit -> Open URL).
- HIPAA: keep name/email/phone out of GTM tags and pixels; use server-side, hashed Enhanced Conversions only (see CLAUDE.md).

## Lead capture (GoHighLevel)

The consultation forms post to a GoHighLevel Inbound Webhook. Before launch, set the
endpoint in `index.html`:

```js
window.WOLF_FORM_ENDPOINT = "https://your-ghl-inbound-webhook-url";
```

Until that is set, submissions log to the console and show the success state for review.
The forms already capture `gclid`, UTMs, and related tracking params as hidden fields.

## Before launch

Replace the `wolfhair.info` placeholder domain in the `<link rel="canonical">` and
`og:url` tags (and in the JSON-LD schema) with the real production domain.

## Local preview

```sh
python3 -m http.server
# then open http://localhost:8000
```
