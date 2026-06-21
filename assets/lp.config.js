/* =========================================================================
   Wolf Hair Restoration - Paid-search Landing Pages
   SINGLE SOURCE OF TRUTH for the LP set. Edit values here only.
   Loaded before lp.js on every LP page.
   ========================================================================= */
window.WOLF_LP = {
  /* ----- contact ----- */
  // CallRail tracking number (fallback display). CONFIRM this is Wolf's CallRail number before launch.
  PHONE_DISPLAY: "(866) 487-9059",
  PHONE_TEL: "+18664879059",
  ADDRESS: "11877 Mason Montgomery Rd, Suite A, Cincinnati, OH 45249",
  CITY_DEFAULT: "Cincinnati",

  // CallRail dynamic number insertion (DNI) swap script.
  // Paste your CallRail swap.js URL, e.g. "//cdn.callrail.com/companies/AAAAAA/BBBBBB/12/swap.js"
  // Leave "" to skip DNI and just show the fallback number above.
  CALLRAIL_SWAP_SRC: "",

  /* ----- copy / offer (no unsubstantiated figures) ----- */
  EXPERIENCE: "decades of surgical experience",
  FINANCING: "Cherry financing available, subject to approval",

  /* ----- legal links ----- */
  PRIVACY_URL: "https://www.wolfhair.com/privacy-policy/",
  NPP_URL: "https://www.wolfhair.com/hipaa-notice/", // Notice of Privacy Practices

  /* ----- lead routing (must be BAA-covered) ----- */
  // The form posts here. Route through a BAA-covered endpoint (e.g. a HIPAA-compliant
  // form handler / GHL inbound webhook under a signed BAA). Leave "" to preview only.
  FORM_ENDPOINT: "",

  /* ----- analytics (placeholders - no PHI ever) ----- */
  GA4_ID: "",               // e.g. "G-XXXXXXX"
  AW_CONVERSION_ID: "",     // e.g. "AW-XXXXXXXXX"
  AW_CONVERSION_LABEL: "",  // e.g. "abcDEfgHIjk"

  /* ----- MEDIA (client populates with HIPAA-authorized media only) -----
     before/after: { before, after, alt, caption }
     testimonials: { quote, name, detail, compensated:true|false }
     If both arrays are empty, the page shows a neutral placeholder (never stock/invented). */
  MEDIA: {
    beforeAfter: [],
    testimonials: []
  }
};
