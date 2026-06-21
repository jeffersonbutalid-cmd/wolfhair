/* =========================================================================
   Wolf Hair Restoration - Paid-search Landing Pages
   SINGLE SOURCE OF TRUTH for the LP set. Edit values here only.
   Loaded before lp.js on every LP page.
   ========================================================================= */
window.WOLF_LP = {
  /* ----- contact ----- */
  // Direct clinic line. NOT a call-tracking number. Used statically in every
  // tel: link, header, sticky bar, and footer. No CallRail / DNI on these pages.
  PHONE: "(513) 774-0400",
  PHONE_TEL: "+15137740400",
  ADDRESS: "11877 Mason Montgomery Rd, Suite A, Cincinnati, OH 45249",
  CITY_DEFAULT: "Cincinnati",

  /* ----- copy / offer ----- */
  // Client-confirmed figure: Dr. Wolf has been treating since 1990 (over 30 years).
  EXPERIENCE: "over 30 years of surgical experience",
  FINANCING: "Cherry financing available, subject to approval",

  /* ----- legal links ----- */
  PRIVACY_URL: "https://www.wolfhair.com/privacy-policy/",
  NPP_URL: "https://www.wolfhair.com/hipaa-notice/", // Notice of Privacy Practices

  /* ----- lead routing (must be BAA-covered) ----- */
  // The form posts here. This is the same GoHighLevel Inbound Webhook the main
  // wolfhair.com site uses; GHL is under a signed BAA. Replace if the LP campaign
  // should route to a different BAA-covered pipeline. Set "" to preview only (no send).
  FORM_ENDPOINT: "https://services.leadconnectorhq.com/hooks/vJ1wfQ4ORRnPRWqmhF8j/webhook-trigger/41ff8704-5857-40db-b474-865ceb4ce1ee",

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
