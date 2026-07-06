# Paid-search landing pages (Google Ads)

A self-contained, HTM-US-compliant landing-page set for the Wolf Hair Restoration
Google Ads campaign. These pages are **separate** from the main marketing site:
they carry their own CSS/JS, no GTM/Meta Pixel, no chat widget, and are
`noindex` so paid traffic never competes with the organic site.

## Files

| File | Purpose |
|------|---------|
| `wolf-hair-restoration.html` | Brand / core page (general "Wolf Hair Restoration" ad group). Static brand H1, full service range. |
| `hair-transplant.html` | Modular surgical page. One H1 swaps by `?service=` (see map below). |
| `womens-hair-restoration.html` | Dedicated page for women's hair loss searches. |
| `non-surgical-hair-restoration.html` | Dedicated page for Keralase laser / non-surgical searches (no PRP named). |
| `assets/lp.config.js` | **Single source of truth.** Edit phone, address, endpoint, analytics IDs, and MEDIA here only. |
| `assets/lp.js` | Behavior: city token, static phone fill, neutral tracking, form post, MEDIA gating, FAQ, before/after slider. |
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

These pages are served from the **`lp.wolfhair.info`** subdomain. Point each ad
group's **Final URL** at the matching link below (prefix with
`https://lp.wolfhair.info`). Netlify serves clean URLs (no `.html`).

| Ad group | Final URL |
|----------|-----------|
| Brand ("Wolf Hair Restoration") | `/wolf-hair-restoration` |
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
| `PHONE` / `PHONE_TEL` | Direct clinic line `(513) 774-0400`. **Not** a call-tracking number; no CallRail/DNI on these pages. | Verify. |
| `ADDRESS` / `CITY_DEFAULT` | NAP + default city token. | Verify. |
| `EXPERIENCE` | Client-confirmed: `over 30 years of surgical experience` (Dr. Wolf, treating since 1990). | Keep. |
| `FINANCING` | `Cherry financing available, subject to approval`. No APR/term/monthly figures. | Keep. |
| `PRIVACY_URL` / `NPP_URL` | Legal links wired into the consent block and footer. | Confirm both resolve on the live domain. |
| `FORM_ENDPOINT` | Where the lead form POSTs. **Must be BAA-covered.** Pre-wired to the same GoHighLevel inbound webhook the main site uses (GHL under signed BAA). Empty = preview mode (no send). | Confirm/replace with the campaign's BAA pipeline. |
| `GA4_ID` | GA4 measurement ID. Empty = GA not loaded. | Optional. |
| `AW_CONVERSION_ID` / `AW_CONVERSION_LABEL` | Google Ads conversion. Both required to fire. | Paste to enable client-side conversion ping. |
| `MEDIA.beforeAfter` / `MEDIA.testimonials` | HIPAA-authorized media (see section 5). | Populate when authorized. |

### Lead flow (form → GHL → booking calendar → thank-you)

On a successful submit, in this order:

1. The lead is POSTed to the BAA-covered `FORM_ENDPOINT` (GHL). **The lead is
   captured here, before anything else** — so it reaches GHL whether or not the
   visitor goes on to book.
2. The conversion fires **at submit** (neutral `lead_form_success` / `generate_lead`
   to `dataLayer`, plus the Google Ads ping if `AW_*` is set). Because it fires
   now, **it counts as a Google conversion even if the visitor never books.**
3. After ~1.1s (to let the tags fire), the visitor is redirected to the GHL
   booking calendar `BOOKING_URL`
   (`https://links.wolfhair.com/widget/bookings/wolfhairintrocall`), prefilled
   with `first_name`, `last_name`, `email`, `phone`.
4. **In GHL**, set that calendar's post-booking action to redirect to
   `/thank-you`. Non-bookers simply stay on the calendar (already captured +
   converted); `/thank-you` no longer re-fires the conversion, so there is no
   double count.

The prefill fields go only to the GHL (BAA-covered) calendar. `gclid` / `?service=`
/ `?city=` are **not** added to the booking URL.

### Conversion / tracking events (no PHI)

The pages push only **neutral, generic** event names to `dataLayer` — never the
service, condition, or any form-field value:

- `lead_submit`, `generate_lead`, `lead_form_success` — fired at a successful submit.
- `call_click` — fired when a `tel:` link is tapped.

No name, email, phone, ZIP, or interest value is ever sent to `dataLayer`,
`gtag`, or the URL. PHI goes **only** to the BAA-covered `FORM_ENDPOINT`.

### Ad attribution (gclid / UTMs)

So Google Ads can attribute the offline conversion, `lp.js` captures
`gclid`, `gbraid`, `wbraid`, `fbclid`, `msclkid`, and the five `utm_*`
params from the landing URL, persists them for the visit, and appends them to
the **form POST only** (the BAA-covered CRM). These are not PHI. They are
**never** pushed to `dataLayer`/`gtag`, and `?service=` / `?city=` are
deliberately excluded from the payload. Map these keys to GHL contact fields
(`gclid` is the one your offline-conversion import keys on).

---

## 4. Phone (no call tracking)

The number is the **direct clinic line, `(513) 774-0400`** — set once in
`PHONE` / `PHONE_TEL` and used in the header, hero, sticky mobile bar, and
footer. There is **no CallRail and no DNI snippet** on these pages. `lp.js`
fills the displayed number and `tel:` href from the config and fires a neutral
`call_click` event on tap (no PHI, no service/city param).

---

## 5. Where to drop HIPAA-authorized MEDIA

**Branding:** all three pages use the main site's look (Newsreader serif
headings, bone palette, clay-blue accents, pale-yellow CTA) via `lp.css`.

**Before/after slider:** the **hair-transplant page** carries a drag-to-compare
slider (`.ba`) using the real authorized patient photos already on the main
site (`assets/img/ba1-*`, `ba2-*`). The **Women's** and **Non-surgical** pages
intentionally keep the neutral placeholder — male surgical-transplant photos
would misrepresent those services. Add matching authorized media for each
before showing a slider there.

Real patient media is **off by default** on the placeholder sections. Until
populated, each renders a neutral placeholder (never stock photos or invented
reviews).

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
- **No "PRP" anywhere** on these Google-facing pages (Google-restricted term;
  Google reads the full landing page). The non-surgical page leads on Keralase
  laser + consultation; PRP is handled off-Google.
- ABHRS certifies the **surgeon**, not the clinic. The footer carries the
  required "ABHRS is a private certifying board, not an ABMS member board" line.
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

- [ ] `FORM_ENDPOINT` confirmed as the BAA-covered GHL inbound webhook (pre-wired
      to the main-site webhook; replace if the campaign uses a different pipeline).
- [ ] `PHONE` confirmed as the clinic line `(513) 774-0400` (no call tracking).
- [ ] `PRIVACY_URL` and `NPP_URL` resolve on the live domain.
- [ ] `GA4_ID` / `AW_CONVERSION_ID` / `AW_CONVERSION_LABEL` set if client-side
      conversion is wanted (otherwise leave blank).
- [ ] MEDIA populated with authorized assets, or left empty (placeholders show).
- [ ] Google Ads Final URLs set per section 2.
- [ ] `htm-us-compliance` subagent run and signed off.
