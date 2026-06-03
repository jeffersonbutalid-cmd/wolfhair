# Wolf Hair Restoration — Landing Page

Doctor-led hair restoration landing page for Wolf Hair Restoration (Cincinnati, OH).
Static site: plain HTML, CSS, and JS with no build step.

## Structure

- `index.html` — the landing page
- `assets/wolf.css` — shared styles (design tokens drive the theme)
- `assets/wolf.js` — interactions: lead form, before/after slider, reviews carousel, FAQ, scroll reveals, gclid/UTM capture
- `assets/img/` — page imagery
- `netlify.toml` — Netlify publish settings, clean URLs, security and cache headers
- `CLAUDE.md` — brand, compliance, and content conventions (read before editing copy)

## Deploy with GitHub + Netlify

1. Push this repo to GitHub.
2. In Netlify, choose **Add new site → Import an existing project** and pick this GitHub repo.
3. Netlify auto-detects `netlify.toml`. There is no build command and the publish directory is the repo root, so just deploy.

Every push to the connected branch triggers an automatic redeploy.

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
