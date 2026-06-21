# Paid-search landing pages (Google Ads)

A self-contained, HTM-US-compliant landing-page set for the Wolf Hair Restoration
Google Ads campaign. These pages are **separate** from the main marketing site:
they carry their own CSS/JS, no GTM/Meta Pixel, no chat widget, and are
`noindex` so paid traffic never competes with the organic site.

## Files

| File | Purpose |
|------|---------|
| `hair-transplant.html` | Modular surgical page. One H1 swaps by `?service=` (see map below). |
| `womens-hair-restoration.html` | Dedicated page for women's hair loss searches. |
| `non-surgical-hair-restoration.html` | Dedicated page for PRP / Keralase / prescription searches. |
| `assets/lp.config.js` | **Single source of truth.** Edit phone, address, endpoint, analytics IDs, and MEDIA here only. |
| `assets/lp.js` | Behavior: city token, CallRail DNI, neutral tracking, form post, MEDIA gating, FAQ. |
| `assets/lp.css` | Self-contained styles. No dependency on `wolf.css`. |

All three pages load, in order: `assets/lp.config.js` then `assets/lp.js` (both
`defer`), and `assets/lp.css` in the head. `hair-transplant.html` also runs a
small **synchronous** inline script before paint to swap the H1 by `?service=`
(prevents flash/layout shift).

---

## 1. `?service=` -> ad-group map (`hair-transplant.html`)

The H1, subhead, and on-page emphasis change with the `?service=` query param.
`{CITY}` in each H1 is replaced by `?city=` (default `Cincinnati`). Unknown or
missing values fall back to `core`.

| `?service=` value | Ad group | H1 rendered | Extra on-page emphasis |
|-------------------|----------|-------------|------------------------|
| *(none)* / `core` | General hair transplant | Hair Transplant in {CITY} | none |
| `fue` | FUE | FUE Hair Transplant in {CITY} | none |
| `artas` | ARTAS robotic | ARTAS Robotic Hair Transplant in {CITY} | `#artas-card` highlighted |
| `cost` | Cost / financing | Hair Transplant Financing in {CITY} | `#financing` highlighted |
| `surgeon` | Surgeon / brand | Hair Transplant by Dr. Bradley R. Wolf | none |

`?city=` is sanitized (strips `<>`, trims, 40-char cap) and fills every
`[data-city]` token. Example: `/hair-transplant?service=fue&city=Dayton`.

---

## 2. Google Ads final-URL map

Point each ad group's **Final URL** at the matching link. Netlify serves clean
URLs (no `.html`).

| Ad group | Final URL |
|----------|-----------|
| Hair transplant (core) | `/hair-transplant` |
| FUE | `/hair-transplant?service=fue` |
| ARTAS robotic | `/hair-transplant?service=artas` |
| Cost / financing | `/hair-transplant?service=cost` |
| Surgeon / brand | `/hair-transplant?service=surgeon` |
| Women's hair restoration | `/womens-hair-restoration` |
| Non-surgical (PRP / Keralase) | `/non-surgical-hair-restoration` |

Notes:
- Append `&city=<City>` (or `?city=<City>` for the dedicated pages) for
  geo-targeted ad groups, e.g. `/womens-hair-restoration?city=Dayton`.
- Use the Final URL field for these params, not tracking templates, so the H1
  swap runs on the landing page itself.
- gclid/gbraid/wbraid and UTMs are carried automatically by Google's auto-tagging
  and are read from the URL by the form/tracking code at submit time.

---

## 3. Configuration constants (`assets/lp.config.js`)

Everything client-specific lives in `window.WOLF_LP`. Edit this file only.

| Key | What it is | Launch action |
|-----|------------|---------------|
| `PHONE_DISPLAY` / `PHONE_TEL` | Fallback CallRail number, currently `(866) 487-9059`. | Confirm this is Wolf's CallRail tracking number. |
| `ADDRESS` / `CITY_DEFAULT` | NAP + default city token. | Verify. |
| `CALLRAIL_SWAP_SRC` | CallRail DNI swap.js URL. Empty = no DNI, shows fallback only. | Paste swap.js URL (see section 4). |
| `EXPERIENCE` / `FINANCING` | Approved copy snippets (no invented figures). | Keep as-is unless legal updates. |
| `PRIVACY_URL` / `NPP_URL` | Legal links wired into the consent block and footer. | Confirm both resolve on the live domain. |
| `FORM_ENDPOINT` | Where the lead form POSTs. **Must be BAA-covered.** Empty = preview mode (no send). | Paste the GHL inbound webhook (BAA signed). |
| `GA4_ID` | GA4 measurement ID. Empty = GA not loaded. | Optional. |
| `AW_CONVERSION_ID` / `AW_CONVERSION_LABEL` | Google Ads conversion. Both required to fire. | Paste to enable client-side conversion ping. |
| `MEDIA.beforeAfter` / `MEDIA.testimonials` | HIPAA-authorized media (see section 5). | Populate when authorized. |

### Conversion / tracking events (no PHI)

The pages push only **neutral, generic** event names to `dataLayer` — never the
service, condition, or any form-field value:

- `lead_submit` — fired once on a successful form submit.
- `call_click` — fired when a `tel:` link is tapped.

No name, email, phone, ZIP, or interest value is ever sent to `dataLayer`,
`gtag`, or the URL. PHI goes **only** to the BAA-covered `FORM_ENDPOINT`.

---

## 4. CallRail snippet (DNI)

The fallback number is hard-coded in `lp.config.js` (`PHONE_DISPLAY`). To enable
Dynamic Number Insertion so CallRail swaps in a per-source number:

1. In CallRail, get the swap.js URL for this tracker, e.g.
   `//cdn.callrail.com/companies/AAAAAA/BBBBBB/12/swap.js`.
2. Paste it into `CALLRAIL_SWAP_SRC` in `assets/lp.config.js`.

`lp.js` injects the script automatically when the value is non-empty. CallRail
then swaps every visible number and `tel:` link; the `call_click` event still
fires on tap. Leave the value empty to skip DNI and show the fallback number.

---

## 5. Where to drop HIPAA-authorized MEDIA

Real patient media is **off by default**. Until populated, each media section
renders a neutral placeholder (never stock photos or invented reviews).

Edit `MEDIA` in `assets/lp.config.js`:

```js
MEDIA: {
  beforeAfter: [
    { before: "/assets/img/ba-01-before.jpg",
      after:  "/assets/img/ba-01-after.jpg",
      alt:    "Patient 1 crown",          // describes the photo
      caption:"12 months after FUE. Individual results vary." }
  ],
  testimonials: [
    { quote: "...", name: "First name L.", detail: "FUE patient",
      compensated: false }   // set true to auto-add the paid-endorsement line
  ]
}
```

Rules baked into the rendering:
- Only real, HIPAA-authorized patient photos. No stock, no AI, no composites.
- `compensated: true` automatically prints a material-connection disclosure.
- Empty arrays => compliant placeholder text with "Individual results vary."

Drop the image files in `assets/img/` and reference them by path as above.

---

## 6. Compliance summary (HTM-US)

Baked into the markup and copy; keep it that way:

- `<meta name="robots" content="noindex">` on all three pages.
- ARTAS is "FDA-cleared," never "FDA-approved." No "exosome" or "stem cell"
  offer claims. No "#1 / best / award-winning." No guarantees.
- "Individual results vary" accompanies every results/efficacy claim.
- Two **separate, unbundled** required consents in the form:
  `sms_consent` (A2P 10DLC) and `privacy_ack` (privacy policy / NPP).
- No PHI to any pixel, `gtag`, `dataLayer`, or URL — only to `FORM_ENDPOINT`.
- Verified credentials retained (ABHRS-certified founding surgeon, Past
  President of the ISHRS, treating since 1990).

Run the `htm-us-compliance` subagent before launch and confirm the four legal
links resolve on the production domain.

---

## 7. Pre-launch checklist

- [ ] `FORM_ENDPOINT` set to the BAA-covered GHL inbound webhook.
- [ ] `CALLRAIL_SWAP_SRC` set (or intentionally left blank) and `PHONE_DISPLAY`
      confirmed as the CallRail number.
- [ ] `PRIVACY_URL` and `NPP_URL` resolve on the live domain.
- [ ] `GA4_ID` / `AW_CONVERSION_ID` / `AW_CONVERSION_LABEL` set if client-side
      conversion is wanted (otherwise leave blank).
- [ ] MEDIA populated with authorized assets, or left empty (placeholders show).
- [ ] Google Ads Final URLs set per section 2.
- [ ] `htm-us-compliance` subagent run and signed off.
