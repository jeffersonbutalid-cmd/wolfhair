# CLAUDE.md - Wolf Hair Restoration landing pages

Instructions for Claude (and the team) working on this repo. Read this before editing.

## What this is
Five paid-search landing pages for **Wolf Hair Restoration**, a doctor-led hair transplant clinic in Cincinnati, Ohio, run as a Hair Transplant Marketing (HTM) client. The pages feed the Google Ads campaign and capture consultation leads into GoHighLevel. Deployed as a static site on **GitHub + Netlify**.

## Source of truth
- Facts: **https://www.wolfhair.com/** (always verify against this, never invent).
- Tone reference only: https://wolfhair.info/landingpage
- Do not reintroduce the old LP's errors: Renton WA address, +123 456 7890, "Dr. Chao", "Hair Loss Fix MD", "#1", "Award-Winning".

## Verified facts (quick reference)
- Clinic: 11877 Mason Montgomery Rd., Suite A, Cincinnati, OH 45249 | 513-774-0400 | Mon to Fri, 9 AM to 5 PM
- Founder: Dr. Bradley Wolf, MD, FISHRS (ABHRS board-certified, Past President of the ISHRS, treating since 1990)
- Medical Director: Dr. Scott Welden, MD (board-certified physician, 20+ years, ISHRS member, trained under Dr. Wolf)
- Procedures: FUE, FUT, ARTAS robotic (FDA-cleared), PRP, Keralase
- Offer: from $2,990 entry package, interest-free financing, free consultation
- Socials: facebook.com/WolfMedical, instagram.com/wolfhairrestoration, youtube.com/@wolfmedical1087

## Deployment: GitHub + Netlify
- This folder is the **site root**. Push it as the repo and connect the repo to Netlify.
- `netlify.toml` is included: it sets the publish directory, strips `.html` to clean URLs, and adds security and cache headers. No build command needed (static site).
- Steps: `git init` in this folder, commit, push to a GitHub repo, then in Netlify pick "Import from GitHub" and select the repo. Netlify auto-detects `netlify.toml`.
- **Before launch, set the real production domain** in all of: every `<link rel="canonical">`, every `og:url`, `sitemap.xml`, the `Sitemap:` line in `robots.txt`, and the links in `llms.txt`. They currently use the placeholder `wolfhair.info`.
- After the first deploy, submit `sitemap.xml` in Google Search Console.
- Local preview: `python3 -m http.server` then open http://localhost:8000

## Data capture: GoHighLevel (GHL)
Lead data must land in GHL. Two supported paths:

**A. Recommended: keep the built-in styled form, post to a GHL Inbound Webhook.**
- Set `window.WOLF_FORM_ENDPOINT` (or `data-endpoint` on the form) to your GHL Inbound Webhook URL.
- Map the posted JSON fields to GHL contact fields (full field list in README section 3).
- Keeps the design, the inline A2P 10DLC consent UI, and the gclid/UTM capture exactly as built. Fastest and most compliant.

**B. Alternative: embed the native GHL form widget.**
- Paste the GHL form iframe into the `#consult` section of each page. `wolf.js` auto-detects GHL / LeadConnector iframes and appends gclid + UTMs to the iframe `src`.
- In the GHL form builder, add hidden fields with matching **Query Keys**: `gclid`, `gbraid`, `wbraid`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, `msclkid`.
- **CRITICAL:** if you use the native embed, the A2P 10DLC consent text and the optional promo checkbox MUST be rebuilt INSIDE the GHL form, because that is the form actually submitted. Consent in the surrounding HTML does not count when the submit happens in the GHL iframe.

## Build and brand conventions
- Mobile-first. Design and test at 375px first, then scale up.
- Type: Fraunces (serif display) + Inter (body). Earthy premium palette in `assets/wolf.css` `:root` tokens (ink, bone, clay, sky, slate). Do not add new colors or fonts without reason.
- Shared `assets/wolf.css` and `assets/wolf.js`. Each page links them.
- Keep JSON-LD on every page (MedicalClinic, Physician x2, FAQPage, MedicalProcedure, Offer, BreadcrumbList, Review). Validate after any schema edit.

## Voice rules (hard)
- American English. The audience is Cincinnati, not British spelling.
- NO em dashes and NO en dashes anywhere in copy. Use commas, periods, or "to" for ranges.
- No AI filler (no "delve", "elevate", "unlock", "seamless", "in today's world"). Plain, warm, confident.
- Run `/humanizer` on any new copy.
- No guarantees. Results language stays "natural-looking" with "individual results vary".

## Compliance (US healthcare) - non-negotiable
Run the `htm-us-compliance` subagent before any new launch. Established rules for this client:
- **KEEP the credential claims.** Doctor-led, board-certified, ABHRS board-certified founding surgeon, Past President of the ISHRS, FDA-cleared ARTAS, since 1990 are verified, defensible, and help Google Ads credibility. Google's healthcare policy permits truthful, verifiable credentials. Do not strip them.
- DROP unverifiable superlatives: no "#1", no "best", no "award-winning".
- NO "exosome" or "stem cell" offer claims (FDA-sensitive, no approved product for hair loss).
- ARTAS is "FDA-cleared", never "FDA-approved" (510k device).
- A2P 10DLC: transactional consent is given by submitting; promotional consent is gated to the optional checkbox only.
- HIPAA: sign a BAA with GHL; send NO name, email, or phone to Google, GA4, or any pixel; healthcare remarketing OFF; Restricted Data Processing ON; Enhanced Conversions hashed and server-side only.
- The privacy policy must carry SMS consent language, and the four legal links must resolve on the live domain.

## Files
- Pages: index.html, hair-transplant-cincinnati.html, fue-artas.html, cost-financing.html, brand.html
- Shared: assets/wolf.css, assets/wolf.js
- AI search and infra: llms.txt, robots.txt, sitemap.xml, pricing.txt, netlify.toml
- Handoff detail: README.md
